import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { ContentStrategy, CarouselPlan } from './types';

export class CarouselArchitect {
  static async execute(strategy: ContentStrategy, canonicalDraft: string, targetSlides: number, traceId: string): Promise<CarouselPlan> {
    const prompt = `Architect a carousel layout.
Target Slide Count: ${targetSlides}
Strategy: ${JSON.stringify(strategy)}
Draft: ${canonicalDraft}

You must allocate the narrative across exactly ${targetSlides} slides. DO NOT use generic roles like "Step 02".
Assign real narrative roles (e.g. HOOK, PROBLEM_CONTEXT, FRAMEWORK_INTRO, APPLICATION, INSIGHT, CTA).
No slide may be empty.

Return ONLY JSON matching:
{
  "slides": [
    {
      "role": "Narrative role",
      "objective": "What this slide accomplishes",
      "headline": "Punchy slide headline",
      "body": "Main supporting text",
      "bullets": ["Optional", "bullets"],
      "example": "Optional example",
      "evidence": "Optional evidence",
      "takeaway": "Optional takeaway",
      "visualConcept": "What should visually be depicted",
      "CTA": "Optional CTA"
    }
  ]
}`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'CAROUSEL_PLANNING',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) throw new Error(`CarouselArchitect failed (Trace: ${traceId})`);

    const parsed = JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim());
    return parsed as CarouselPlan;
  }
}
