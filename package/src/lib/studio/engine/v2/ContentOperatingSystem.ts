import { ContentJobState, ContentPackage } from "./models/ContentJob";
import { ContentExecutionEvent, EventStage, EventStatus } from "./models/ContentExecutionEvent";
import { ContentEventBus } from "./ContentEventBus";
import { IntentAnalyst } from "./agents/01_IntentAnalyst";
import { ResearchPlanner } from "./agents/02_ResearchPlanner";
import { WebResearcher } from "./agents/03_WebResearcher";
import { ContentStrategist } from "./agents/05_ContentStrategist";
import { ContentWriter } from "./agents/06_ContentWriter";
import { Humanizer } from "./agents/07_Humanizer";
import { CarouselArchitect } from "./agents/08_CarouselArchitect";
import { VisualDirector } from "./agents/09_VisualDirector";
import { QualityAssurance } from "./agents/10_QualityAssurance";

// ── In-memory job store ────────────────────────────────────────────────────
// In production: Redis / PostgreSQL
const jobStore = new Map<string, ContentPackage>();

// Approval gate registry: jobId → { resolve, reject }
type ApprovalGate = { resolve: (modifications?: string) => void; reject: (reason: string) => void };
const approvalGates = new Map<string, ApprovalGate>();

export class ContentOperatingSystem {
  // ── Submit ─────────────────────────────────────────────────────────────
  static async submitIntake(originalInput: string): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const job: ContentPackage = {
      id,
      originalInput,
      status: 'INTAKE',
      events: [],
      trace: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    jobStore.set(id, job);

    // Kick off async pipeline — errors are caught inside
    this.processJob(id).catch(err => {
      console.error(`[ContentOS] Job ${id} unhandled crash:`, err);
    });

    return id;
  }

  // ── Approve ────────────────────────────────────────────────────────────
  static approveJob(jobId: string, modifications?: string): boolean {
    const gate = approvalGates.get(jobId);
    if (!gate) return false;
    gate.resolve(modifications);
    approvalGates.delete(jobId);
    return true;
  }

  // ── Reject / Cancel ────────────────────────────────────────────────────
  static rejectJob(jobId: string, reason = 'User cancelled'): boolean {
    const gate = approvalGates.get(jobId);
    if (!gate) return false;
    gate.reject(reason);
    approvalGates.delete(jobId);
    return true;
  }

  // ── Read ───────────────────────────────────────────────────────────────
  static getJob(id: string): ContentPackage | undefined {
    return jobStore.get(id);
  }

  static listJobs(): ContentPackage[] {
    return Array.from(jobStore.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Core Pipeline
  // ══════════════════════════════════════════════════════════════════════
  private static async processJob(id: string) {
    const job = jobStore.get(id);
    if (!job) throw new Error("Job not found in store");

    let seq = 0;

    // ── Helpers ──────────────────────────────────────────────────────────
    const emit = (
      stage: EventStage,
      status: EventStatus,
      label: string,
      opts: Partial<ContentExecutionEvent> = {}
    ): ContentExecutionEvent => {
      const event: ContentExecutionEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        jobId: id,
        timestamp: Date.now(),
        sequence: seq++,
        stage,
        status,
        label,
        ...opts,
      };
      job.events = [...(job.events || []), event];
      job.updatedAt = Date.now();
      jobStore.set(id, job);
      ContentEventBus.emit(id, event);
      console.log(`[ContentOS] Job ${id} -> ${stage}:${status} [seq=${event.sequence}]`);
      return event;
    };

    const transition = (state: ContentJobState) => {
      job.status = state;
      job.updatedAt = Date.now();
      jobStore.set(id, job);
    };

    const runAgent = async <T>(
      stage: EventStage,
      jobState: ContentJobState,
      label: string,
      agent: string,
      capability: string,
      fn: () => Promise<T>
    ): Promise<T> => {
      transition(jobState);
      const _start = emit(stage, 'RUNNING', label, { agent, capability });
      const t0 = Date.now();
      try {
        const result = await fn();
        emit(stage, 'COMPLETED', label, {
          agent,
          capability,
          durationMs: Date.now() - t0,
          sequence: seq - 1, // don't re-sequence; just update previous
        });
        // Re-emit with completed status (new event, different sequence)
        return result;
      } catch (e: any) {
        const category = e.message?.includes('429') ? 'RATE_LIMIT'
          : e.message?.includes('timeout') ? 'TIMEOUT'
          : e.message?.includes('JSON') || e.message?.includes('schema') ? 'SCHEMA_FAILURE'
          : 'PROVIDER_ERROR';

        emit(stage, 'FAILED', label, {
          agent,
          capability,
          durationMs: Date.now() - t0,
          errorCategory: category,
          errorMessage: e.message,
          retryable: category !== 'SCHEMA_FAILURE',
        });
        throw e;
      }
    };

    // ── Pipeline ─────────────────────────────────────────────────────────
    try {
      emit('INTAKE', 'RUNNING', 'Job Accepted');

      // 01 INTENT ANALYST
      job.brief = await runAgent(
        'INTENT', 'ANALYZING', 'Intent Analysis', 'Intent Analyst', 'STRUCTURED_CONTENT',
        () => IntentAnalyst.execute(job.originalInput)
      );

      // 02 RESEARCH PLANNER
      job.researchPlan = await runAgent(
        'RESEARCH_PLAN', 'RESEARCH_PLANNING', 'Research Planning', 'Research Planner', 'STRUCTURED_CONTENT',
        () => ResearchPlanner.execute(job.brief!)
      );

      // 03 WEB RESEARCHER
      job.evidence = await runAgent(
        'RESEARCH', 'RESEARCHING', 'Web Research', 'Web Researcher', 'WEB_SEARCH',
        () => WebResearcher.execute(job.researchPlan!)
      );

      // Emit sources if available
      if (job.evidence?.claims?.length) {
        const sources = job.evidence.claims
          .filter(c => c.sourceUrl)
          .map(c => ({
            title: c.sourceTitle || c.sourceUrl,
            url: c.sourceUrl,
            domain: (() => { try { return new URL(c.sourceUrl).hostname; } catch { return c.sourceUrl; } })(),
            sourceType: 'web' as const,
            claimCount: 1,
          }));
        emit('EVIDENCE', 'COMPLETED', 'Evidence Extracted', {
          agent: 'Evidence Synthesizer',
          sources,
          outputSummary: `${job.evidence.claims.length} evidence claims extracted.`,
          outputMetadata: { claimCount: job.evidence.claims.length, sourceCount: sources.length }
        });
      }

      // 05 CONTENT STRATEGIST
      job.strategy = await runAgent(
        'STRATEGY', 'STRATEGIZING', 'Content Strategy', 'Content Strategist', 'STRUCTURED_CONTENT',
        () => ContentStrategist.execute(job.brief!, job.evidence!)
      );

      // ── APPROVAL GATE ──────────────────────────────────────────────────
      transition('WAITING_FOR_APPROVAL');
      emit('APPROVAL', 'WAITING_FOR_APPROVAL', 'Awaiting User Approval', {
        agent: 'BuildOS',
        outputSummary: 'Content brief and strategy ready for review.',
        outputMetadata: {
          topic: job.brief?.topic,
          audience: job.brief?.audience,
          objective: job.brief?.objective,
          angle: job.strategy?.angle,
          hook: job.strategy?.hook,
          coreInsights: job.strategy?.coreInsights,
          likelyFormat: job.brief?.likelyFormat,
          evidenceCount: job.evidence?.claims?.length,
        }
      });

      // Wait for user to approve or reject
      const modifications = await new Promise<string | undefined>((resolve, reject) => {
        approvalGates.set(id, { resolve, reject });
        // Auto-reject after 30 minutes
        setTimeout(() => {
          if (approvalGates.has(id)) {
            approvalGates.delete(id);
            reject(new Error('Approval timeout (30 min)'));
          }
        }, 30 * 60 * 1000);
      });

      if (modifications) {
        emit('APPROVAL', 'COMPLETED', 'Approval with Modifications', {
          outputSummary: `User requested modifications: ${modifications}`,
        });
      } else {
        emit('APPROVAL', 'COMPLETED', 'Approved by User');
      }

      // 06 CONTENT WRITER
      job.draft = await runAgent(
        'DRAFT', 'DRAFTING', 'Content Writing', 'Content Writer', 'POST_GENERATION',
        () => ContentWriter.execute(job.brief!, job.strategy!, job.evidence!)
      );

      // 07 HUMANIZER
      job.humanizedDraft = await runAgent(
        'HUMANIZE', 'HUMANIZING', 'Humanization', 'Humanizer', 'CONTENT_ENHANCEMENT',
        () => Humanizer.execute(job.draft!)
      );

      // 08 CAROUSEL ARCHITECT
      job.carousel = await runAgent(
        'CAROUSEL', 'FORMAT_PLANNING', 'Carousel Architecture', 'Carousel Architect', 'CAROUSEL_PLANNING',
        () => CarouselArchitect.execute(job.humanizedDraft!)
      );

      // 09 VISUAL DIRECTOR
      job.designSpec = await runAgent(
        'DESIGN', 'DESIGNING', 'Visual Direction', 'Visual Director', 'DESIGN_SPEC',
        () => VisualDirector.execute(job.carousel, job.brief!)
      );

      // 10 QUALITY ASSURANCE
      const qaResult = await runAgent(
        'QA', 'QA', 'Quality Assurance', 'QA Reviewer', 'STRUCTURED_CONTENT',
        () => QualityAssurance.execute(job.humanizedDraft!)
      );
      job.qa = qaResult;

      if (!qaResult.passed) {
        throw new Error(`QA_FAILURE: ${qaResult.critique}`);
      }

      transition('READY');
      emit('RENDER', 'COMPLETED', 'Pipeline Complete — Ready for Render', {
        agent: 'BuildOS',
        outputSummary: 'All checks passed. Design specification locked.',
        outputMetadata: {
          qualityScore: qaResult,
          layoutFamily: job.designSpec?.spec?.layoutFamily,
          slideCount: job.carousel?.slides?.length ?? 'N/A',
        }
      });

      ContentEventBus.complete(id);

    } catch (e: any) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      transition('FAILED');
      job.error = errorMsg;
      jobStore.set(id, job);
      ContentEventBus.complete(id);
      console.error(`[ContentOS] Job ${id} FAILED: ${errorMsg}`);
    }
  }
}
