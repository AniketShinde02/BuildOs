import { ResearchPlan, EvidencePack } from "../models/ContentJob";

// In the future, this will connect to Dappier/Firecrawl/Tavily adapters
export class WebResearcher {
  static async execute(plan: ResearchPlan): Promise<EvidencePack> {
    if (plan.queries.length === 0) {
      return { claims: [] };
    }

    console.log(`[WebResearcher] Executing ${plan.queries.length} queries in parallel...`);
    
    // Simulate parallel research fetching
    const results = await Promise.allSettled(
      plan.queries.map(async (q) => {
        // Mock delay for research
        await new Promise(r => setTimeout(r, plan.depth === 'DEEP' ? 3000 : 1000));
        return {
          claim: `Verified insight related to: ${q}`,
          evidence: `Statistical or factual evidence found during research of "${q}"`,
          sourceUrl: "https://example.com/research",
          sourceTitle: "Industry Data 2026",
          confidence: 0.95
        };
      })
    );

    const claims: EvidencePack['claims'] = [];
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        claims.push(res.value);
      }
    });

    return { claims };
  }
}
