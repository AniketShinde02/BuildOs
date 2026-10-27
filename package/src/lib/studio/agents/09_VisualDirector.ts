import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { CarouselPlan, DesignPlan, ContentStrategy } from './types';

export class VisualDirector {
  static async execute(strategy: ContentStrategy, carouselPlan: CarouselPlan, traceId: string): Promise<DesignPlan> {
    const prompt = `Determine the Visual Design Specification.
Format: Carousel
Strategy: ${JSON.stringify(strategy)}
Slides Plan: ${JSON.stringify(carouselPlan)}

Return ONLY JSON matching:
{
  "layoutFamily": "linear-tech|editorial-magazine|swiss-grid|neo-brutalist|glass-surface|warm-humanist|saas-showcase|carousel-playbook|typographic-monument|dynamic-hybrid",
  "composition": "How elements are arranged",
  "typography": "Font family and scaling intent",
  "hierarchy": "Visual hierarchy",
  "imagery": "Imagery style",
  "diagrams": "Diagram styles",
  "visualMetaphors": "Metaphors to use",
  "density": "high|medium|low",
  "whitespace": "tight|balanced|generous",
  "slideSpecificComposition": {}
}`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'DESIGN_SPEC',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) throw new Error(`VisualDirector failed (Trace: ${traceId})`);

    return JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim()) as DesignPlan;
  }
}
