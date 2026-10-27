import { generateContent, AIGenerateOptions } from '@/lib/ai/gateway';
import { IntentOutput, EvidenceItem, ContentStrategy } from './types';

export class ContentStrategist {
  static async execute(intent: IntentOutput, evidence: EvidenceItem[], traceId: string): Promise<ContentStrategy> {
    const prompt = `Determine the strategy for this content.
Intent: ${JSON.stringify(intent)}
Evidence: ${JSON.stringify(evidence)}

Return ONLY JSON matching this schema:
{
  "angle": "What is the unique perspective?",
  "hookDirection": "What tension or claim hooks the reader?",
  "narrative": "What is the story arc?",
  "keyInsights": ["List of main points to cover"],
  "audienceTension": "What is the audience struggling with?",
  "takeaway": "What is the actionable takeaway?",
  "format": "Chosen format",
  "CTA": "Call to action direction"
}`;

    const options: AIGenerateOptions = {
      prompt,
      capability: 'STRUCTURED_CONTENT',
      structuredOutput: true,
      traceId
    };

    const result = await generateContent(options);
    if (!result.text) throw new Error(`ContentStrategist failed (Trace: ${traceId})`);

    return JSON.parse(result.text.replace(/```json/gi, '').replace(/```/g, '').trim());
  }
}
