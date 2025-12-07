import React from 'react';

export enum ProjectStep {
  IDEA = 'IDEA',
  RESEARCH = 'RESEARCH',
  PRD = 'PRD',
  PLANNING = 'PLANNING',
  DESIGN = 'DESIGN',
  CODE = 'CODE'
}

export interface ResearchDocument {
  id: string;
  name: string;
  content: string; // Text content or Base64 string for binaries
  mimeType: string; // e.g., 'text/plain', 'application/pdf'
  source: 'upload' | 'manual';
}

export interface ProjectState {
  id?: string;
  updatedAt?: number;
  title: string;
  currentStep: ProjectStep;
  research: ResearchDocument[];
  ideaInput: string;
  synthesizedIdea: string;
  prdOutput: string;
  roadmapOutput: string;
  designSystemOutput: string;
  codePromptOutput: string;
  isGenerating: boolean;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  updatedAt: number;
}

export interface GenerationRequest {
  model: string;
  systemInstruction: string;
  prompt: string;
}

export interface NavItem {
  label: string;
  step: ProjectStep;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}