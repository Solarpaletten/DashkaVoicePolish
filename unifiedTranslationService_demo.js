class UnifiedTranslationService {
  constructor() {
    this.supportedLanguages = {
      'RU': { name: 'Русский', code: 'ru' },
      'DE': { name: 'Deutsch', code: 'de' },
      'EN': { name: 'English', code: 'en' }
    };
  }
  
  async translateText(text, fromLang, toLang) {
    return {
      originalText: text,
      translatedText: `[${toLang}] ${text}`,
      confidence: 0.5
    };
  }
  
  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, config]) => ({
      code, name: config.name
    }));
  }
  
  getStats() {
    return { status: 'demo' };
  }
}

module.exports = { UnifiedTranslationService };
