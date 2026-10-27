import { generateContent } from "@/lib/ai/gateway";
import { ContentBrief, EvidencePack, ContentStrategy } from "../models/ContentJob";

export class ContentStrategist {
  static async execute(brief: ContentBrief, evidence: EvidencePack | undefined): Promise<ContentStrategy> {
    const systemInstruction = `You are the BuildOS Content Strategist.
Given the brief and research evidence, formulate the ultimate content strategy.
Return ONLY valid JSON matching this exact schema:

{
  "angle": "The unique perspective or take",
  "hook": "The core opening hook concept",
  "narrative": "How the story or argument flows",
  "coreInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "audienceTension": "The main problem the audience faces",
  "takeaway": "The ultimate lesson",
  "cta": "What the user should do next"
}`;

    const promptData = { brief, evidence };

    const result = await generateContent({
      prompt: JSON.stringify(promptData, null, 2),
      systemInstruction,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true
    });

    if (!result.text) {
      throw new Error("Content Strategist failed.");
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      return JSON.parse(cleanedJson) as ContentStrategy;
    } catch {
      throw new Error("Content Strategist produced invalid schema.");
    }
  }
}
