import { generateContent } from "@/lib/ai/gateway";
import { ContentBrief, ContentStrategy, EvidencePack, ContentDraft } from "../models/ContentJob";

export class ContentWriter {
  static async execute(brief: ContentBrief, strategy: ContentStrategy, evidence?: EvidencePack): Promise<ContentDraft> {
    const systemInstruction = `You are the BuildOS Content Writer.
Write the actual content based strictly on the strategy and evidence.
DO NOT hallucinate statistics or case studies.
Return ONLY valid JSON matching this exact schema:

{
  "title": "Punchy hook title",
  "body": "The main narrative body text",
  "points": ["Key point 1", "Key point 2", "Key point 3"]
}

Respect all protected terms: ${brief.protectedTerms.join(', ')}`;

    const promptData = { strategy, evidence };

    const result = await generateContent({
      prompt: JSON.stringify(promptData, null, 2),
      systemInstruction,
      capability: 'POST_GENERATION',
      structuredOutput: true
    });

    if (!result.text) {
      throw new Error("Content Writer failed.");
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      return JSON.parse(cleanedJson) as ContentDraft;
    } catch {
      throw new Error("Content Writer produced invalid schema.");
    }
  }
}
