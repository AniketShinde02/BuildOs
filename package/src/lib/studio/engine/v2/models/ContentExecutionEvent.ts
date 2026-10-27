/**
 * ContentExecutionEvent — the structured real-time event protocol
 * emitted by every agent in the 11-stage pipeline.
 * 
 * These events are persisted on the ContentPackage and streamed via SSE.
 * The browser subscribes by jobId and reconstructs state from events.
 */

export type EventStage =
  | 'INTAKE'
  | 'INTENT'
  | 'RESEARCH_PLAN'
  | 'RESEARCH'
  | 'EVIDENCE'
  | 'STRATEGY'
  | 'APPROVAL'
  | 'DRAFT'
  | 'HUMANIZE'
  | 'CAROUSEL'
  | 'DESIGN'
  | 'QA'
  | 'RENDER';

export type EventStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'WAITING_FOR_APPROVAL';

export type EventSeverity = 'INFO' | 'WARN' | 'ERROR';

export interface ModelTrace {
  provider: string;
  model: string;
  capability: string;
  attemptCount: number;
  durationMs: number;
  status: 'success' | 'timeout' | 'error' | '429';
  error?: string;
  fallbackUsed?: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ToolCall {
  tool: 'SEARCH' | 'FETCH' | 'CRAWL' | 'EXTRACT' | 'DATABASE';
  query?: string;
  url?: string;
  resultCount?: number;
  durationMs: number;
  status: 'success' | 'failed';
}

export interface SourceItem {
  title: string;
  url: string;
  domain: string;
  date?: string;
  sourceType: 'web' | 'article' | 'research' | 'news';
  claimCount?: number;
}

export interface ContentExecutionEvent {
  id: string;            // unique event ID (uuid-style)
  jobId: string;
  traceId?: string;
  timestamp: number;     // epoch ms
  sequence: number;      // monotonically increasing per job
  stage: EventStage;
  status: EventStatus;
  label: string;         // short human-readable label e.g. "Intent Analysis"
  description?: string;  // longer description of what happened
  durationMs?: number;   // set when status = COMPLETED/FAILED
  agent?: string;        // e.g. "Intent Analyst"
  capability?: string;   // e.g. "STRUCTURED_CONTENT"
  provider?: string;
  model?: string;
  modelTrace?: ModelTrace;
  toolCalls?: ToolCall[];
  sources?: SourceItem[];
  // Output summaries (never raw model output)
  outputSummary?: string;
  outputMetadata?: Record<string, unknown>;
  // Error info
  errorCategory?: 'TIMEOUT' | 'RATE_LIMIT' | 'SCHEMA_FAILURE' | 'PROVIDER_ERROR' | 'QA_FAILURE';
  errorMessage?: string;
  retryable?: boolean;
}

export type ContentExecutionEventType = 'event' | 'heartbeat' | 'complete' | 'error';

export interface ContentExecutionStream {
  type: ContentExecutionEventType;
  data?: ContentExecutionEvent;
  jobId?: string;
  timestamp?: number;
}
