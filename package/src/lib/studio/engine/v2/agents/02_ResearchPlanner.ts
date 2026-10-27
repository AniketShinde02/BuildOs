import { generateContent } from "@/lib/ai/gateway";
import { ContentBrief, ResearchPlan } from "../models/ContentJob";

export class ResearchPlanner {
  static async execute(brief: ContentBrief): Promise<ResearchPlan> {
    if (!brief.researchNeeded) {
      return { queries: [], depth: 'QUICK' };
    }

    const systemInstruction = `You are the BuildOS Research Planner.
Based on the ContentBrief, output an optimal web search plan.
Return ONLY valid JSON matching this exact schema:

{
  "queries": ["Specific search query 1", "Specific search query 2"],
  "depth": "QUICK" | "STANDARD" | "DEEP"
}

Ensure queries are highly targeted to extract factual, up-to-date data.`;

    const result = await generateContent({
      prompt: JSON.stringify(brief, null, 2),
      systemInstruction,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true
    });

    if (!result.text) {
      // Fallback if AI fails
      return { queries: brief.coreQuestions, depth: brief.freshnessRequirement };
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      return JSON.parse(cleanedJson) as ResearchPlan;
    } catch {
      return { queries: brief.coreQuestions, depth: brief.freshnessRequirement };
    }
  }
}
