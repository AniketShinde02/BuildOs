import { generateContent } from "@/lib/ai/gateway";
import { ContentDraft } from "../models/ContentJob";

export interface CarouselSpec {
  slides: {
    type: 'COVER' | 'STORY' | 'METRIC' | 'LESSON' | 'CTA';
    headline: string;
    body: string;
    visualPriority: string;
  }[];
}

export class CarouselArchitect {
  static async execute(draft: ContentDraft): Promise<CarouselSpec> {
    const systemInstruction = `You are the BuildOS Carousel Architect.
You translate a linear draft into a sequence of highly engaging carousel slides.
Return ONLY valid JSON matching this exact schema:

{
  "slides": [
    {
      "type": "COVER",
      "headline": "...",
      "body": "...",
      "visualPriority": "..."
    }
  ]
}
Max 6 slides.
`;

    const result = await generateContent({
      prompt: JSON.stringify(draft, null, 2),
      systemInstruction,
      capability: 'CAROUSEL_PLANNING',
      structuredOutput: true
    });

    if (!result.text) {
      throw new Error("Carousel Architect failed.");
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      return JSON.parse(cleanedJson) as CarouselSpec;
    } catch {
      throw new Error("Carousel Architect produced invalid schema.");
    }
  }
}
