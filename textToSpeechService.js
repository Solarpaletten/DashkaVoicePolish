const fs = require('fs');
const path = require('path');

// Заглушка для TTS - в production можно подключить реальные сервисы
class TextToSpeechService {
  constructor() {
    this.supportedLanguages = {
      'en': 'English',
      'ru': 'Russian', 
      'de': 'German',
      'es': 'Spanish',
      'cs': 'Czech',
      'pl': 'Polish',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'no': 'Norwegian'
    };
    console.log('🔊 Text-to-Speech Service initialized (mock mode)');
  }

  async generateSpeech(text, language = 'en', voice = 'default') {
    try {
      // Создаем временную папку
      const tempDir = path.join(__dirname, '../../tmp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Генерируем имя файла
      const filename = `tts_${Date.now()}_${language}.mp3`;
      const filepath = path.join(tempDir, filename);

      // В реальной реализации здесь будет вызов TTS API
      // Пока создаем пустой аудиофайл как заглушку
      const mockAudioData = Buffer.alloc(1024); // 1KB заглушка
      fs.writeFileSync(filepath, mockAudioData);

      console.log(`🔊 Generated speech for "${text.substring(0, 50)}..." in ${language}`);

      return {
        audioPath: filepath,
        language,
        text,
        duration: Math.ceil(text.length * 0.1), // примерная длительность
        provider: 'mock-tts'
      };

    } catch (error) {
      console.error('TTS Error:', error);
      throw new Error(`Text-to-Speech failed: ${error.message}`);
    }
  }

  // Функция для обратной совместимости с существующими ботами
  async speakText(text, language = 'en') {
    const result = await this.generateSpeech(text, language);
    return result.audioPath;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

// Создаем единый экземпляр
const ttsService = new TextToSpeechService();

// Экспортируем функцию для совместимости
async function speakText(text, language = 'en') {
  return await ttsService.speakText(text, language);
}

module.exports = {
  speakText,
  TextToSpeechService,
  ttsService
};
