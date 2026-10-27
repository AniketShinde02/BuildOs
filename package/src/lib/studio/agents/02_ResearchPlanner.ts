import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { IntentOutput, ResearchPlan } from './types';

export class ResearchPlanner {
  static async execute(intent: IntentOutput, traceId: string): Promise<ResearchPlan> {
    if (!intent.researchRequired) {
      return {
        questions: [],
        queries: [],
        sourceTypes: [],
        freshnessRequirement: 'none',
        maxSources: 0,
        depth: 'quick'
      };
    }

    const prompt = `Based on this user intent, determine what needs to be researched.
Topic: "${intent.topic}"
Intent: "${intent.intent}"
Depth: "${intent.researchDepth}"

Return ONLY JSON matching this schema:
{
  "questions": ["What questions must be answered?"],
  "queries": ["Specific search queries to run"],
  "sourceTypes": ["official", "primary", "industry", "community"],
  "freshnessRequirement": "e.g. past 6 months, past 2 years, none",
  "maxSources": 5,
  "depth": "${intent.researchDepth}"
}`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) {
      throw new Error(`ResearchPlanner failed (Trace: ${traceId})`);
    }

    return JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim());
  }
}
