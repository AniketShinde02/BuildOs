import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';

export class FormatDistributionAgent {
  static async execute(canonicalDraft: string, targetPlatforms: string[], traceId: string): Promise<Record<string, string>> {
    const prompt = `Format this canonical content for specific platforms.
Canonical: ${canonicalDraft}
Target Platforms: ${targetPlatforms.join(', ')}

Return ONLY JSON matching:
{
  "platformName": "formatted post text"
}
Do NOT hallucinate new facts.`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'POST_GENERATION',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) return { default: canonicalDraft };

    try {
      return JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim());
    } catch {
      return { default: canonicalDraft };
    }
  }
}
