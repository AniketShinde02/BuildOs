import { generateContent } from "@/lib/ai/gateway";
import { ContentDraft } from "../models/ContentJob";

export class Humanizer {
  static async execute(draft: ContentDraft): Promise<ContentDraft> {
    const systemInstruction = `You are the BuildOS Humanizer.
Your goal is to detect AI-slop (generic openings, corporate jargon, filler transitions) and rewrite the draft to sound authentic, crisp, and human.
DO NOT change the factual claims.

Return ONLY valid JSON matching this exact schema:

{
  "title": "Humanized title",
  "body": "Humanized body",
  "points": ["Humanized point 1", "Humanized point 2"]
}`;

    const result = await generateContent({
      prompt: JSON.stringify(draft, null, 2),
      systemInstruction,
      capability: 'CONTENT_ENHANCEMENT',
      structuredOutput: true
    });

    if (!result.text) {
      return draft; // Fallback to original if humanization fails
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      return JSON.parse(cleanedJson) as ContentDraft;
    } catch {
      return draft;
    }
  }
}
