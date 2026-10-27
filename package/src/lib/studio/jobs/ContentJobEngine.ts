import { adminDb } from '@/utils/firebase-admin';
import { ContentPackage } from '../agents/types';
import { IntentAnalyst } from '../agents/01_IntentAnalyst';
import { ResearchPlanner } from '../agents/02_ResearchPlanner';
import { WebResearcher } from '../agents/03_WebResearcher';
import { EvidenceSynthesizer } from '../agents/04_EvidenceSynthesizer';
import { ContentStrategist } from '../agents/05_ContentStrategist';
import { ContentWriter } from '../agents/06_ContentWriter';
import { Humanizer } from '../agents/07_Humanizer';
import { CarouselArchitect } from '../agents/08_CarouselArchitect';
import { VisualDirector } from '../agents/09_VisualDirector';
import { QualityAssuranceAgent } from '../agents/10_QualityAssurance';
import { FormatDistributionAgent } from '../agents/11_FormatDistribution';

export class ContentJobEngine {
  static async createJob(userId: string, input: string): Promise<string> {
    const docRef = await adminDb.collection('Users').doc(userId).collection('ContentJobs').add({
      originalInput: input,
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  static async getJob(userId: string, jobId: string): Promise<any> {
    const snap = await adminDb.collection('Users').doc(userId).collection('ContentJobs').doc(jobId).get();
    return snap.exists ? snap.data() : null;
  }

  private static async updateJobState(userId: string, jobId: string, update: Partial<ContentPackage>) {
    await adminDb.collection('Users').doc(userId).collection('ContentJobs').doc(jobId).update({
      ...update,
      updatedAt: new Date().toISOString()
    });
  }

  // Fire-and-forget worker executor
  static async executePipeline(userId: string, jobId: string, input: string) {
    const traceId = `job-${jobId}`;
    const pack: Partial<ContentPackage> = { id: jobId, originalInput: input, generationTrace: [] };

    const markTrace = async (stage: string, ms: number) => {
      pack.generationTrace = pack.generationTrace || [];
      pack.generationTrace.push({ stage, durationMs: ms });
      await this.updateJobState(userId, jobId, { generationTrace: pack.generationTrace });
    };

    try {
      // 01. Intent Analyst
      await this.updateJobState(userId, jobId, { status: 'RESEARCHING' });
      const t1 = Date.now();
      pack.intent = await IntentAnalyst.execute(input, traceId);
      await markTrace('01_Intent', Date.now() - t1);

      // 02 & 03. Research Plan & Web Search
      const t2 = Date.now();
      pack.researchPlan = await ResearchPlanner.execute(pack.intent, traceId);
      await markTrace('02_ResearchPlan', Date.now() - t2);

      const t3 = Date.now();
      pack.researchResults = await WebResearcher.execute(pack.researchPlan, traceId);
      await markTrace('03_WebSearch', Date.now() - t3);

      // 04. Evidence
      const t4 = Date.now();
      pack.evidence = await EvidenceSynthesizer.execute(pack.researchResults, traceId);
      await markTrace('04_Evidence', Date.now() - t4);

      // 05. Strategy
      await this.updateJobState(userId, jobId, { status: 'GENERATING' });
      const t5 = Date.now();
      pack.strategy = await ContentStrategist.execute(pack.intent, pack.evidence, traceId);
      await markTrace('05_Strategy', Date.now() - t5);

      // 06. Writer
      const t6 = Date.now();
      pack.canonicalDraft = await ContentWriter.execute(pack.strategy, pack.evidence, traceId);
      await markTrace('06_Writer', Date.now() - t6);

      // 07. Humanizer
      const t7 = Date.now();
      pack.humanizedDraft = await Humanizer.execute(pack.canonicalDraft, traceId);
      await markTrace('07_Humanizer', Date.now() - t7);

      // 08. Carousel Architect (Optional/Conditional based on format)
      if (pack.intent.formatCandidates.includes('carousel')) {
        const t8 = Date.now();
        pack.carousel = await CarouselArchitect.execute(pack.strategy, pack.humanizedDraft, 5, traceId);
        await markTrace('08_CarouselArchitect', Date.now() - t8);
        
        // 09. Visual Director
        const t9 = Date.now();
        pack.designSpec = await VisualDirector.execute(pack.strategy, pack.carousel, traceId);
        await markTrace('09_VisualDirector', Date.now() - t9);
      }

      // 10. QA
      await this.updateJobState(userId, jobId, { status: 'VALIDATING' });
      const t10 = Date.now();
      pack.qa = await QualityAssuranceAgent.execute(pack as ContentPackage, traceId);
      await markTrace('10_QA', Date.now() - t10);

      if (!pack.qa.passed) {
        throw new Error(`QA Failed: ${pack.qa.failures.join(', ')}`);
      }

      // 11. Distribution
      const t11 = Date.now();
      pack.platformVariants = await FormatDistributionAgent.execute(pack.humanizedDraft, ['LinkedIn', 'X'], traceId);
      await markTrace('11_Distribution', Date.now() - t11);

      // SUCCESS
      await this.updateJobState(userId, jobId, {
        ...pack,
        status: 'READY'
      });

    } catch (err: any) {
      console.error(`[JobEngine] Job ${jobId} failed:`, err);
      await this.updateJobState(userId, jobId, {
        status: 'FAILED',
        error: err.message || 'Unknown failure'
      });
    }
  }
}
