import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { ContentStrategy, EvidenceItem } from './types';

export class ContentWriter {
  static async execute(strategy: ContentStrategy, evidence: EvidenceItem[], traceId: string): Promise<string> {
    const prompt = `Write the canonical content draft.
Strategy: ${JSON.stringify(strategy, null, 2)}
Evidence: ${JSON.stringify(evidence, null, 2)}

Rules:
- NO generic AI filler. NO "In today's rapidly evolving...".
- Short, punchy sentences.
- Specific numbers and facts only if supported by Evidence.
- Output ONLY the final content text. No markdown fences.`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'POST_GENERATION',
      structuredOutput: false,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) throw new Error(`ContentWriter failed (Trace: ${traceId})`);

    return result.text.trim();
  }
}
