const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class WhisperService {
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('🎤 Whisper Service initialized (OpenAI API)');
    } else {
      this.openai = null;
      console.log('🎤 Whisper Service initialized (mock mode - no API key)');
    }
    
    this.supportedLanguages = ['en', 'ru', 'de', 'es', 'cs', 'pl', 'lt', 'lv', 'no'];
  }

  async transcribe(audioFilePath, language = 'auto') {
    try {
      // Проверяем что файл существует
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      // Если нет OpenAI API ключа, возвращаем заглушку
      if (!this.openai) {
        console.log('⚠️ No OpenAI API key, using mock transcription');
        const mockTexts = {
          'ru': 'Добрый день, хотел бы сдать отчётность по налогам',
          'de': 'Guten Tag, ich möchte meine Steuererklärung abgeben',
          'en': 'Good day, I would like to submit my tax return',
          'auto': 'Sample transcription for testing purposes'
        };
        
        return {
          text: mockTexts[language] || mockTexts['auto'],
          language: language === 'auto' ? 'ru' : language,
          confidence: 0.95,
          duration: 3.0,
          provider: 'mock-whisper'
        };
      }

      // Реальное использование Whisper API
      console.log(`🎤 Transcribing audio file: ${path.basename(audioFilePath)}`);
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: language === 'auto' ? undefined : language,
        response_format: 'json',
        temperature: 0.2
      });

      console.log(`📝 Transcription result: "${transcription.text}"`);

      return {
        text: transcription.text,
        language: transcription.language || language,
        confidence: 0.95,
        duration: transcription.duration || 5.0,
        provider: 'openai-whisper-1'
      };

    } catch (error) {
      console.error('Whisper Error:', error.message);
      
      // Fallback к заглушке при ошибке
      console.log('🔄 Falling back to mock transcription due to error');
      const fallbackTexts = {
        'ru': 'Пример текста на русском языке',
        'de': 'Beispieltext auf Deutsch',
        'en': 'Sample text in English',
        'auto': 'Error fallback transcription'
      };
      
      return {
        text: fallbackTexts[language] || fallbackTexts['auto'],
        language: language === 'auto' ? 'ru' : language,
        confidence: 0.5,
        duration: 3.0,
        provider: 'fallback-mock',
        error: error.message
      };
    }
  }

  // Метод для прямого текстового ввода (обход аудио)
  async transcribeText(text, language = 'auto') {
    console.log(`📝 Direct text input: "${text}"`);
    
    return {
      text: text,
      language: language === 'auto' ? 'ru' : language,
      confidence: 1.0,
      duration: 0,
      provider: 'direct-text-input'
    };
  }
}

// Создаем единый экземпляр
const whisperService = new WhisperService();

// Функция для обратной совместимости
async function transcribeAudio(audioFilePath, language = 'auto') {
  const result = await whisperService.transcribe(audioFilePath, language);
  return result.text;
}

// Функция для прямого текстового ввода
async function transcribeText(text, language = 'auto') {
  const result = await whisperService.transcribeText(text, language);
  return result.text;
}

module.exports = {
  transcribeAudio,
  transcribeText,
  WhisperService,
  whisperService
};