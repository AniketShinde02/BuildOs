import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { IntentOutput } from './types';

export class IntentAnalyst {
  static async execute(topic: string, traceId: string): Promise<IntentOutput> {
    const prompt = `Analyze this user topic and determine the intent.
Topic: "${topic}"

Return ONLY JSON matching this schema:
{
  "topic": "Cleaned canonical topic",
  "intent": "What is the user actually trying to communicate?",
  "audience": "Who is the primary audience?",
  "objective": "What is the goal of the post?",
  "formatCandidates": ["carousel", "post"],
  "timeframe": "evergreen | current | future",
  "entities": ["list of entities", "brands", "people"],
  "protectedTerms": ["terms that must not be changed"],
  "researchRequired": boolean,
  "researchDepth": "quick" | "standard" | "deep"
}`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) {
      throw new Error(`IntentAnalyst failed: All models returned null (Trace: ${traceId})`);
    }

    try {
      const parsed = JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim());
      return parsed as IntentOutput;
    } catch {
      throw new Error(`IntentAnalyst failed to parse output. Trace: ${traceId}`);
    }
  }
}
