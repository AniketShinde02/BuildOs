export type ContentJobState = 
  | 'IDLE'
  | 'INTAKE'
  | 'ANALYZING'
  | 'RESEARCH_PLANNING'
  | 'RESEARCHING'
  | 'EVIDENCE_BUILDING'
  | 'STRATEGIZING'
  | 'DRAFTING'
  | 'HUMANIZING'
  | 'FORMAT_PLANNING'
  | 'DESIGNING'
  | 'QA'
  | 'WAITING_FOR_APPROVAL'
  | 'RENDERING'
  | 'READY'
  | 'QUEUED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'FAILED';

export interface ContentBrief {
  topic: string;
  audience: string;
  objective: string;
  likelyFormat: string;
  researchNeeded: boolean;
  coreQuestions: string[];
  protectedTerms: string[];
  freshnessRequirement: 'QUICK' | 'STANDARD' | 'DEEP';
  ambiguity: string;
}

export interface ResearchPlan {
  queries: string[];
  depth: 'QUICK' | 'STANDARD' | 'DEEP';
}

export interface EvidencePack {
  claims: {
    claim: string;
    evidence: string;
    sourceUrl: string;
    sourceTitle: string;
    confidence: number;
  }[];
}

export interface ContentStrategy {
  angle: string;
  hook: string;
  narrative: string;
  coreInsights: string[];
  audienceTension: string;
  takeaway: string;
  cta: string;
}

export interface ContentDraft {
  title: string;
  body: string;
  points: string[];
}

export interface ContentPackage {
  id: string;
  originalInput: string;
  status: ContentJobState;
  brief?: ContentBrief;
  researchPlan?: ResearchPlan;
  evidence?: EvidencePack;
  strategy?: ContentStrategy;
  draft?: ContentDraft;
  humanizedDraft?: ContentDraft;
  carousel?: any; // To be defined
  designSpec?: any; // To be defined
  qa?: { passed: boolean; critique: string; overall?: number; contrastScore?: number; hierarchyScore?: number; balanceScore?: number; humanTouchScore?: number };
  events?: import('./ContentExecutionEvent').ContentExecutionEvent[];
  trace?: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

