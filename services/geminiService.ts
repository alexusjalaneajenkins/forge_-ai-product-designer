import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProjectState, ResearchDocument } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a Chief Product Officer. Your goal is to clarify and elevate raw ideas into actionable product visions.",
      temperature: 0.7,
    }
  });

  return response.text || "Failed to refine idea.";
};

export const generateResearchPrompt = async (synthesizedIdea: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Based on the following Product Vision, create a "Research Pathfinder" prompt that I can feed into another AI (like Google NotebookLM).
    
    PRODUCT VISION:
    ${synthesizedIdea}
    
    TASK:
    Write a prompt that instructs an AI to act as a Market Researcher.
    The generated prompt should ask for:
    1. Competitor Analysis (Identify 3-5 direct/indirect competitors)
    2. User Pain Point deep dive based on the target users in the vision.
    3. Technical Feasibility checks for the key differentiators.
    4. Strategic opportunities or gaps in the market.
    
    Do NOT generate the research yourself. Generate the PROMPT that will ask for this research.
    The output should be just the prompt text, ready to copy-paste.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "Failed to generate research prompt.";
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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Using 2.5 Flash for robust multimodal support
    contents: { parts },
    config: {
      systemInstruction: "You are a world-class Product Manager. You are strict, detailed, and focus on viability and user value.",
      temperature: 0.7,
    }
  });

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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a Technical Project Manager. Break down complex goals into achievable tasks.",
    }
  });

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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Good for creative/visual tasks
    contents: prompt,
    config: {
      systemInstruction: "You are a Senior UI/UX Designer. Focus on aesthetics, accessibility, and modern design trends.",
    }
  });

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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a Lead Software Engineer. You write precise, technical specifications for other developers.",
    }
  });

  return response.text || "Failed to generate Code Prompt.";
};