import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProjectState, ResearchDocument } from "../types";

const getClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateContentWithRetry = async (
  ai: GoogleGenAI,
  modelName: string,
  contents: any,
  config?: any,
  maxRetries = 3
): Promise<GenerateContentResponse> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Use ai.models.generateContent which is the correct API for @google/genai SDK
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });
      return response;
    } catch (error: any) {
      // Check for 429 (Resource Exhausted) or 503 (Service Unavailable)
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.code === 429;
      if (isRateLimit && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Gemini API 429 hit. Retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await delay(waitTime);
        attempt++;
      } else {
        console.error(`Gemini API Error (Model: ${modelName}):`, error);
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
};

const formatResearchContext = (docs: ResearchDocument[]): string => {
  if (docs.length === 0) return "No specific research documents provided.";
  return docs
    .filter(d => d.mimeType.startsWith('text')) // Only format text docs here if used
    .map(d => `--- SOURCE: ${d.name} ---\n${d.content}\n--- END SOURCE ---`)
    .join("\n\n");
};

export const refineIdea = async (rawInput: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Analyze the following raw product idea and synthesize it into a clear, professional Product Vision Statement.
    
    RAW IDEA:
    ${rawInput}
    
    TASK:
    Create a structured Vision Statement including:
    1. Product Name Suggestion
    2. Core Value Proposition (The "Why")
    3. Target Users (The "Who")
    4. Key Differentiators (The "How")
    5. Elevator Pitch (One concise sentence)
    
    Output in Markdown. Keep it professional and inspiring.
  `;

  const response = await generateContentWithRetry(
    ai,
    'gemini-2.0-flash',
    prompt, // Pass string directly
    {
      systemInstruction: "You are a Chief Product Officer. Your goal is to clarify and elevate raw ideas into actionable product visions.",
      temperature: 0.7,
    }
  );

  return response.text || "Failed to refine idea.";
};

export const generateResearchPrompt = async (synthesizedIdea: string): Promise<{ mission: string, report: string }> => {
  const ai = getClient();

  // 1. Generate the "Deep Research Mission" (The instruction for the Agent)
  const missionPrompt = `
    Based on the following Product Vision, generate a specific, high-level "Deep Research Mission" prompt for an autonomous AI research agent (like Google NotebookLM Deep Research).
    
    The mission should instruct the agent to:
    1. Find direct and indirect competitors.
    2. Uncover recent trends in the specific market.
    3. Identify user demographics and pain points.
    4. Look for technical feasibility and similar existing implementations.
    
    Keep the mission prompt concise (under 3 sentences) but directive. Start with "Your mission is to..."
    
    Product Vision:
    ${synthesizedIdea}
  `;

  const missionResponse = await generateContentWithRetry(
    ai,
    'gemini-2.0-flash',
    missionPrompt,
    {
      temperature: 0.7,
    }
  );

  const mission = (missionResponse.text || "").trim();

  // 2. Construct the "Report Generation Prompt" (The template for the Chat)
  // This uses the user's specific template, injecting the vision at the top.
  const report = `You are an expert Market Researcher with a deep understanding of the product landscape. Your task is to analyze the provided Product Vision Statement and the gathered research sources to generate a comprehensive research report.

Here is the Product Vision Statement:

---
${synthesizedIdea}
---

Please generate a detailed research report addressing the following sections:

**1. Competitor Analysis:**
Identify and analyze 3-5 direct and indirect competitors. For each competitor, describe their primary offerings, target audience, key strengths, and weaknesses. Specifically, evaluate how well they currently address (or fail to address) the needs that this product aims to solve.

**2. User Pain Point Deep Dive:**
Conduct a detailed deep dive into the specific, acute pain points experienced by the target users identified in the vision. What are their most significant frustrations? Elaborate on how existing solutions might fall short, creating a market opportunity.

**3. Technical Feasibility Check:**
Assess the technical feasibility of the product's "Key Differentiators." Discuss:
    *   **Current Technological Landscape:** Are the necessary technologies (AI models, APIs, data sources) readily available?
    *   **Potential Technical Challenges:** What are the significant hurdles (e.g., accuracy, privacy, latency)?
    *   **Existing Solutions:** Are there precedents that demonstrate feasibility?

**4. Strategic Opportunities & Market Gaps:**
Identify strategic opportunities or underserved gaps in the market that this product could uniquely leverage. Consider emerging trends, unmet needs, and potential for new business models.`;

  return { mission, report };
};

export const generatePRD = async (idea: string, research: ResearchDocument[]): Promise<string> => {
  const ai = getClient();

  // Construct the Parts array for Multimodal Input
  const parts: any[] = [];

  // 1. Instructions & Idea
  parts.push({
    text: `
    Analyze the following product vision and the provided research documents (if any).
    
    PRODUCT VISION:
    ${idea}

    TASK:
    Create a comprehensive Product Requirements Document (PRD).
    The Output must be formatted in Markdown.
    Include:
    1. Executive Summary
    2. Problem Statement
    3. Target Audience (User Personas)
    4. Key Features (Functional Requirements)
    5. Success Metrics (KPIs)
    6. Risks & Mitigation
    `
  });

  // 2. Add Research Documents
  research.forEach(doc => {
    if (doc.mimeType === 'application/pdf') {
      // PDF handling: Send as inlineData
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: doc.content // Base64 string
        }
      });
    } else {
      // Text handling: Send as text part
      parts.push({
        text: `--- RESEARCH DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ---`
      });
    }
  });

  const response = await generateContentWithRetry(
    ai,
    'gemini-2.0-flash',
    { parts }, // Pass object with parts
    {
      systemInstruction: "You are a world-class Product Manager. You are strict, detailed, and focus on viability and user value.",
      temperature: 0.7,
    }
  );

  return response.text || "Failed to generate PRD.";
};

export const generatePlan = async (prd: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Based on the following PRD, create a step-by-step Implementation Plan (Roadmap).

    PRD CONTENT:
    ${prd}

    TASK:
    Create a phased roadmap (Phase 1: MVP, Phase 2: Polish, Phase 3: Scale).
    For each phase, list specific actionable tasks for Design, Frontend, and Backend.
    Output in Markdown.
  `;

  const response = await generateContentWithRetry(
    ai,
    'gemini-2.0-flash',
    prompt,
    {
      systemInstruction: "You are a Technical Project Manager. Break down complex goals into achievable tasks.",
    }
  );

  return response.text || "Failed to generate Plan.";
};

export const generateDesignSystem = async (prd: string, plan: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Based on the PRD and Plan, create a Design System & Blueprint.

    PRD: ${prd.substring(0, 3000)}... (truncated for context)
    PLAN: ${plan.substring(0, 3000)}... (truncated for context)

    TASK:
    1. Define the Color Palette (Primary, Secondary, Accent, Backgrounds) with hex codes and rationale.
    2. Typography choices (Headings, Body).
    3. UI Component Library definition (List core components needed).
    4. UX Flow description for the main user journey.
    5. A text-based description of the 'Vibe' (e.g., Professional, Playful, Industrial).
    
    Output in Markdown.
  `;

  const response = await generateContentWithRetry(
    ai,
    'gemini-2.0-flash',
    prompt,
    {
      systemInstruction: "You are a Senior UI/UX Designer. Focus on aesthetics, accessibility, and modern design trends.",
    }
  );

  return response.text || "Failed to generate Design.";
};

export const generateCodePrompt = async (projectState: ProjectState): Promise<string> => {
  const ai = getClient();

  const prompt = `
    I need a master prompt to give to an AI coding agent (like yourself or a Cursor bot) to build this entire application.
    
    Summarize the Project:
    - Idea: ${projectState.synthesizedIdea || projectState.ideaInput}
    - Key Design Elements: Extract from Design System output.
    - Stack: React, Tailwind, TypeScript.
    
    DESIGN SYSTEM CONTEXT:
    ${projectState.designSystemOutput}

    PLAN CONTEXT:
    ${projectState.roadmapOutput}

    TASK:
    Write a highly detailed "Master Prompt" that I can copy and paste into an IDE AI to scaffold the project. 
    It should specify the stack (React + Vite + TS + Tailwind), directory structure, and the first 3 core components to build.
    
    CRITICAL INSTRUCTION:
    Return ONLY the raw prompt text. Do not include any conversational filler like "Here is your prompt" or markdown code blocks (\`\`\`). 
    The output must be ready to copy-paste directly.
  `;

  const response = await generateContentWithRetry(
    ai,
    'gemini-2.0-flash',
    prompt,
    {
      systemInstruction: "You are a Lead Software Engineer. You write precise, technical specifications for other developers.",
    }
  );

  return response.text || "Failed to generate Code Prompt.";
};