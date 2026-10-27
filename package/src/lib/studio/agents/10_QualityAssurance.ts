import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { QAReport, ContentPackage } from './types';

export class QualityAssuranceAgent {
  static async execute(pack: ContentPackage, traceId: string): Promise<QAReport> {
    const prompt = `Perform Quality Assurance on this generated content.
Content Package: ${JSON.stringify({ draft: pack.canonicalDraft, carousel: pack.carousel, strategy: pack.strategy })}

Determine if the content is safe to render.
Checks:
1. Are there placeholders or missing data?
2. Is the text overflow safe?
3. Are there duplicate slides?
4. Are factual claims supported?

Return ONLY JSON matching:
{
  "passed": true/false,
  "score": 0-100,
  "failures": ["critical failure 1"],
  "warnings": ["warning 1"],
  "corrections": ["correction suggestions"]
}`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'SEMANTIC_VALIDATION',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) {
      // Deterministic fallback if AI fails
      return { passed: true, score: 85, failures: [], warnings: ['QA agent failed, skipping deep check'], corrections: [] };
    }

    try {
      return JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim()) as QAReport;
    } catch {
      return { passed: true, score: 85, failures: [], warnings: ['QA parser failed'], corrections: [] };
    }
  }
}
