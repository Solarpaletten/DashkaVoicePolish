const OpenAI = require('openai');
const { transcribeAudio } = require('./whisperService');
const { speakText } = require('./textToSpeechService');
const fs = require('fs');
const path = require('path');

class UnifiedTranslationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Поддерживаемые языки
    this.supportedLanguages = {
      'EN': { name: 'English', flag: '🇺🇸', code: 'en' },
      'RU': { name: 'Русский', flag: '🇷🇺', code: 'ru' },
      'DE': { name: 'Deutsch', flag: '🇩🇪', code: 'de' },
      'ES': { name: 'Español', flag: '🇪🇸', code: 'es' },
      'CS': { name: 'Čeština', flag: '🇨🇿', code: 'cs' },
      'PL': { name: 'Polski', flag: '🇵🇱', code: 'pl' },
      'LT': { name: 'Lietuvių', flag: '🇱🇹', code: 'lt' },
      'LV': { name: 'Latviešu', flag: '🇱🇻', code: 'lv' },
      'NO': { name: 'Norsk', flag: '🇳🇴', code: 'no' }
    };
    
    console.log('🌍 Unified Translation Service готов с', Object.keys(this.supportedLanguages).length, 'языками');
  }

  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, config]) => ({
      code,
      name: config.name,
      flag: config.flag,
      nativeName: config.name
    }));
  }

  async translateText(text, fromLanguage, toLanguage) {
    const startTime = Date.now();
    
    try {
      if (!this.supportedLanguages[fromLanguage] || !this.supportedLanguages[toLanguage]) {
        throw new Error(`Unsupported language pair: ${fromLanguage} → ${toLanguage}`);
      }

      if (fromLanguage === toLanguage) {
        return {
          originalText: text,
          translatedText: text,
          fromLanguage,
          toLanguage,
          processingTime: Date.now() - startTime,
          confidence: 1.0,
          provider: 'same-language'
        };
      }

      const fromLang = this.supportedLanguages[fromLanguage].name;
      const toLang = this.supportedLanguages[toLanguage].name;
      
      const systemPrompt = `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. 
      
RULES:
- Provide ONLY the translation, no explanations
- Maintain the original tone and style
- Keep formatting if any
- For voice messages, translate naturally and conversationally`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: Math.min(4000, text.length * 3),
        temperature: 0.3
      });

      const translatedText = response.choices[0]?.message?.content?.trim();
      
      if (!translatedText) {
        throw new Error('Translation failed');
      }

      return {
        originalText: text,
        translatedText,
        fromLanguage,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: 0.95,
        provider: 'openai-gpt4o-mini',
        usage: response.usage
      };

    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async translateVoice(audioFilePath, fromLanguage, toLanguage) {
    const startTime = Date.now();
    
    try {
      console.log('🎤 Starting voice translation:', { fromLanguage, toLanguage });
      
      // 1. Распознавание речи
      const transcript = await transcribeAudio(audioFilePath, this.supportedLanguages[fromLanguage].code);
      console.log('📝 Transcript:', transcript);
      
      // 2. Перевод текста
      const translation = await this.translateText(transcript, fromLanguage, toLanguage);
      console.log('🌍 Translation:', translation.translatedText);
      
      // 3. Генерация речи
      const audioPath = await speakText(translation.translatedText, this.supportedLanguages[toLanguage].code);
      console.log('🔊 Audio generated:', audioPath);
      
      return {
        originalText: transcript,
        translatedText: translation.translatedText,
        originalAudio: audioFilePath,
        translatedAudio: audioPath,
        fromLanguage,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: translation.confidence,
        provider: 'solar-voice-pipeline'
      };

    } catch (error) {
      console.error('Voice translation error:', error);
      throw new Error(`Voice translation failed: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Detect the language of the given text. Respond with ONLY the ISO language code from this list: EN, RU, DE, ES, CS, PL, LT, LV, NO. If uncertain, respond with "EN".`
          },
          { role: 'user', content: text.substring(0, 500) }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const detectedCode = response.choices[0]?.message?.content?.trim();
      
      if (this.supportedLanguages[detectedCode]) {
        return {
          language: detectedCode,
          confidence: 0.9,
          provider: 'openai-detection'
        };
      }

      return {
        language: 'EN',
        confidence: 0.5,
        provider: 'fallback'
      };

    } catch (error) {
      console.error('Language detection error:', error);
      return {
        language: 'EN',
        confidence: 0.3,
        provider: 'error-fallback'
      };
    }
  }

  getStats() {
    return {
      supportedLanguages: Object.keys(this.supportedLanguages).length,
      features: [
        'text-translation',
        'voice-translation', 
        'language-detection',
        'real-time-processing'
      ],
      provider: 'SOLAR v2.0 + OpenAI',
      status: 'ready'
    };
  }
}

module.exports = { UnifiedTranslationService };
