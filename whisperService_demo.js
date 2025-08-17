const fs = require('fs');
const path = require('path');

// Заглушка для Whisper - в production используется OpenAI Whisper API
class WhisperService {
  constructor() {
    this.supportedLanguages = ['en', 'ru', 'de', 'es', 'cs', 'pl', 'lt', 'lv', 'no'];
    console.log('🎤 Whisper Service initialized (mock mode)');
  }

  async transcribe(audioFilePath, language = 'auto') {
    try {
      // Проверяем что файл существует
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      // В реальной реализации здесь будет вызов Whisper API
      // Пока возвращаем заглушку
      const mockTranscription = `Sample transcription for audio file in ${language} language`;
      
      console.log(`🎤 Transcribed audio file: ${path.basename(audioFilePath)}`);

      return {
        text: mockTranscription,
        language: language === 'auto' ? 'en' : language,
        confidence: 0.95,
        duration: 5.0,
        provider: 'mock-whisper'
      };

    } catch (error) {
      console.error('Whisper Error:', error);
      throw new Error(`Speech recognition failed: ${error.message}`);
    }
  }
}

// Создаем единый экземпляр
const whisperService = new WhisperService();

// Функция для обратной совместимости
async function transcribeAudio(audioFilePath, language = 'auto') {
  const result = await whisperService.transcribe(audioFilePath, language);
  return result.text;
}

module.exports = {
  transcribeAudio,
  WhisperService,
  whisperService
};
