import { generateContent } from "@/lib/ai/gateway";
import { ContentBrief } from "../models/ContentJob";

export class IntentAnalyst {
  static async execute(originalInput: string): Promise<ContentBrief> {
    const systemInstruction = `You are the BuildOS Intent Analyst.
Your job is to understand the raw user idea and structure it into a formal ContentBrief.
Return ONLY valid JSON matching this exact schema, without any markdown formatting or wrapper objects:

{
  "topic": "Cleaned up version of the core topic",
  "audience": "Target audience (e.g., Beginners, Executives)",
  "objective": "What should the reader learn or do?",
  "likelyFormat": "Educational Carousel, Personal Story, Technical Cheatsheet, etc.",
  "researchNeeded": boolean,
  "coreQuestions": ["Question 1", "Question 2"],
  "protectedTerms": ["List of terms, brands, or numbers that MUST NOT be altered"],
  "freshnessRequirement": "QUICK" | "STANDARD" | "DEEP",
  "ambiguity": "Any missing context or assumptions you had to make"
}`;

    const result = await generateContent({
      prompt: `RAW USER IDEA:\n${originalInput}`,
      systemInstruction,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true
    });

    if (!result.text) {
      throw new Error("Intent Analyst failed to generate brief.");
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      return JSON.parse(cleanedJson) as ContentBrief;
    } catch {
      console.warn("Intent Analyst JSON parse error:", result.text);
      throw new Error("Intent Analyst produced invalid schema.");
    }
  }
}
