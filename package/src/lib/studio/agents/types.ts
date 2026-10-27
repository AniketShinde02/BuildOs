export type ResearchDepth = 'quick' | 'standard' | 'deep';

export interface IntentOutput {
  topic: string;
  intent: string;
  audience: string;
  objective: string;
  formatCandidates: string[];
  timeframe: string;
  entities: string[];
  protectedTerms: string[];
  researchRequired: boolean;
  researchDepth: ResearchDepth;
}

export interface ResearchPlan {
  questions: string[];
  queries: string[];
  sourceTypes: string[];
  freshnessRequirement: string;
  maxSources: number;
  depth: ResearchDepth;
}

export interface EvidenceItem {
  claim: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceDate: string;
  evidence: string;
  confidence: number;
  sourceType: string;
}

export interface ContentStrategy {
  angle: string;
  hookDirection: string;
  narrative: string;
  keyInsights: string[];
  audienceTension: string;
  takeaway: string;
  format: string;
  CTA: string;
}

export interface CarouselSlidePlan {
  role: string;
  objective: string;
  headline: string;
  body: string;
  bullets: string[];
  example: string;
  evidence: string;
  takeaway: string;
  visualConcept: string;
  CTA: string;
}

export interface CarouselPlan {
  slides: CarouselSlidePlan[];
}

export interface DesignPlan {
  layoutFamily: string;
  composition: string;
  typography: string;
  hierarchy: string;
  imagery: string;
  diagrams: string;
  visualMetaphors: string;
  density: string;
  whitespace: string;
  slideSpecificComposition: any;
}

export interface QAReport {
  passed: boolean;
  score: number;
  failures: string[];
  warnings: string[];
  corrections: string[];
}

export interface PlatformMetadata {
  platform: string;
  format: string;
}

export interface ContentPackage {
  id: string;
  originalInput: string;
  intent?: IntentOutput;
  researchPlan?: ResearchPlan;
  researchResults?: any[];
  evidence?: EvidenceItem[];
  strategy?: ContentStrategy;
  canonicalDraft?: string;
  humanizedDraft?: string;
  carousel?: CarouselPlan;
  platformVariants?: Record<string, string>;
  designSpec?: DesignPlan;
  qa?: QAReport;
  generationTrace?: any[];
  status: 'DRAFT' | 'RESEARCHING' | 'GENERATING' | 'VALIDATING' | 'READY' | 'RENDERING' | 'PUBLISHED' | 'FAILED';
  error?: string;
}
