export class Humanizer {
  static readonly BANNED_PHRASES = [
    /in today's rapidly evolving/gi,
    /game-changer/gi,
    /tapestry/gi,
    /delve/gi,
    /unlock your potential/gi,
    /revolutionize/gi,
    /seamlessly/gi
  ];

  static async execute(draft: string, _traceId: string): Promise<string> {
    // Deterministic Pass
    let cleaned = draft;
    for (const regex of this.BANNED_PHRASES) {
      cleaned = cleaned.replace(regex, '');
    }
    
    // Minimal semantic cleanup rule: remove double spaces, weird unicode
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/[^\x20-\x7E\n]/g, '').trim();

    return cleaned;
  }
}
