import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { EvidenceItem } from './types';

export class EvidenceSynthesizer {
  static async execute(researchResults: any[], traceId: string): Promise<EvidenceItem[]> {
    if (!researchResults || researchResults.length === 0) return [];

    const rawContext = researchResults.map(r => r.answer || r.results?.map((x: any) => x.content).join('\n')).join('\n\n');

    const prompt = `Synthesize this raw research into structured evidence claims.
Raw Data:
${rawContext.slice(0, 15000)}

Return ONLY JSON matching an array of EvidenceItem objects:
[
  {
    "claim": "Specific fact or claim",
    "sourceTitle": "Title of source",
    "sourceUrl": "URL",
    "sourceDate": "Date if known",
    "evidence": "Supporting context",
    "confidence": 0-100,
    "sourceType": "primary/secondary"
  }
]`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) return [];

    try {
      const parsed = JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim());
      return Array.isArray(parsed) ? parsed : (parsed.evidence || []);
    } catch {
      return [];
    }
  }
}
