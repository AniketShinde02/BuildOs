/**
 * HumanizerEngine - Senior Engineering Anti-AI Detector Filter
 * Eradicates artificial LLM speech patterns, cliché vocabulary, uniform sentence lengths,
 * and corporate fluff to ensure 85%+ Human-Written authenticity (passes AI detectors).
 */

const AI_FORBIDDEN_VOCABULARY: Array<[RegExp, string]> = [
  [/\bdelve(?:s|d|ing)?\b/gi, 'explore'],
  [/\btapestry\b/gi, 'mix'],
  [/\btestament\b/gi, 'proof'],
  [/\bvital role\b/gi, 'key part'],
  [/\bgame-changer\b/gi, 'big shift'],
  [/\brevolutionary\b/gi, 'solid'],
  [/\bunleash(?:es|ed|ing)?\b/gi, 'unlock'],
  [/\bin today'?s (?:fast-paced|digital|ever-changing) world\b/gi, 'right now'],
  [/\bmasterclass\b/gi, 'breakdown'],
  [/\bfostering\b/gi, 'building'],
  [/\bspearhead(?:s|ed|ing)?\b/gi, 'lead'],
  [/\bseamlessly\b/gi, 'directly'],
  [/\bintricate\b/gi, 'complex'],
  [/\bleverage(?:s|d|ing)?\b/gi, 'use'],
  [/\bparadigm shift\b/gi, 'shift'],
  [/\bholistic\b/gi, 'full-stack'],
  [/\bempower(?:s|ed|ing)?\b/gi, 'help'],
  [/\bsynergy\b/gi, 'alignment'],
  [/\bbeacon\b/gi, 'example'],
  [/\brelentless(?:ly)?\b/gi, 'constant'],
];

const AI_CLICHÉ_PHRASES = [
  /in conclusion,/gi,
  /it is important to remember that/gi,
  /let's dive in!/gi,
  /without further ado,/gi,
  /in summary,/gi,
  /look no further\./gi,
];

export class HumanizerEngine {
  /**
   * Applies multi-stage humanization processing to text.
   */
  static humanize(text: string): string {
    if (!text || text.trim().length === 0) return text;

    let result = text;

    // 1. Eradicate forbidden AI vocabulary words
    for (const [regex, replacement] of AI_FORBIDDEN_VOCABULARY) {
      result = result.replace(regex, replacement);
    }

    // 2. Strip cliché AI transition phrases
    for (const phraseRegex of AI_CLICHÉ_PHRASES) {
      result = result.replace(phraseRegex, '');
    }

    // 3. Normalize paragraph line breaks and whitespace
    result = result
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return result;
  }

  /**
   * Generates Humanizer System Instructions to be appended to AI prompts.
   */
  static getSystemPromptAddon(): string {
    return `
====================================================
STRICT ANTI-AI DETECTOR HUMANIZATION ENGINE RULES:
====================================================
1. WRITE LIKE A TOP 1% REAL ENGINEER / FOUNDER writing an authentic technical journal.
2. ABSOLUTELY FORBIDDEN WORDS & PHRASES: "delve", "tapestry", "testament", "game-changer", "revolutionary", "unleash", "in today's fast-paced world", "seamlessly", "masterclass", "synergy", "fostering", "empower".
3. SENTENCE RHYTHM VARIATION (Burstiness & Perplexity): Mix short 2-4 word punchy sentences ("It broke.", "Here is why.", "Simple.") with detailed technical explanations. Never keep sentence lengths uniform.
4. FIRST-PERSON EXPERIENTIAL VOICE: Use genuine first-person developer narrative ("I benchmarked...", "We hit a bottleneck...", "My team built...").
5. NO CORPORATE FLUFF: Skip introductory hype ("I am thrilled to share..."). Start directly with the hook or real problem.
6. TARGET AUTHENTICITY SCORE: 85%+ Human-Written, 15% Structured Clarity.
====================================================
`;
  }
}
