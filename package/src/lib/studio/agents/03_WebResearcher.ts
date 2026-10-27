import { ResearchPlan } from './types';

// Mock/Adapter implementation for Web Search using Tavily or others
export class WebResearcher {
  static async execute(plan: ResearchPlan, traceId: string): Promise<any[]> {
    if (plan.queries.length === 0) return [];
    
    console.log(`[WebResearcher] Executing parallel research for ${plan.queries.length} queries (Trace: ${traceId})`);
    
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
    if (!TAVILY_API_KEY) {
      console.warn("[WebResearcher] No TAVILY_API_KEY found, skipping research.");
      return [];
    }

    const results = await Promise.allSettled(
      plan.queries.map(async (query) => {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: plan.depth === 'deep' ? 'advanced' : 'basic',
            max_results: plan.maxSources || 3,
            include_answer: true,
          }),
        });
        if (!res.ok) throw new Error(`Tavily failed for query: ${query}`);
        return res.json();
      })
    );

    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    return successfulResults;
  }
}
