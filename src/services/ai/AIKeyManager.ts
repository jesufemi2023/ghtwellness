export class AIKeyManager {
  private keys: string[];
  private currentIndex: number = 0;

  constructor() {
    // Support multiple keys separated by commas for rotation
    // Collect from all possible sources to be safe
    const sources = [
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY,
      process.env.API_KEY
    ];
    
    const allKeys = sources
      .filter(Boolean)
      .join(',')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && k !== "MY_GEMINI_API_KEY");
    
    // De-duplicate keys
    this.keys = [...new Set(allKeys)];
    
    if (this.keys.length === 0) {
      console.warn("No Gemini API keys found. AI features will be disabled.");
    } else {
      console.log(`AI Key Manager initialized with ${this.keys.length} unique key(s).`);
    }
  }

  getKeyCount(): number {
    return this.keys.length;
  }

  getNextKey(): string | null {
    if (this.keys.length === 0) return null;
    const key = this.keys[this.currentIndex];
    // Round-robin rotation
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  hasKeys(): boolean {
    return this.keys.length > 0;
  }
}
