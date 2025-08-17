const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UnifiedTranslationService } = require('./UnifiedTranslationService');

class DashkaBotNodeServer {
  constructor() {
    this.app = express();
    this.port = 8080;
    this.translationService = new UnifiedTranslationService();
    this.requestCount = 0;
    this.translationCache = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    
    console.log('🤖 DashkaBot Node.js Server инициализирован');
  }

  setupMiddleware() {
    // CORS для веб-интерфейса
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // JSON парсер
    this.app.use(express.json({ limit: '10mb' }));
    
    // Multer для загрузки аудио файлов
    const upload = multer({
      dest: 'temp/',
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB
    });
    
    this.upload = upload;
  }

  setupRoutes() {
    // Health check - совместимость с DashkaBot
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'DashkaBot AI Server (Node.js)',
        version: '3.0.0',
        mode: 'production',
        timestamp: new Date().toISOString(),
        requests_processed: this.requestCount,
        supported_languages: Object.keys(this.translationService.supportedLanguages).length
      });
    });

    // Текстовый перевод - основной endpoint для DashkaBot
    this.app.post('/translate', async (req, res) => {
      try {
        this.requestCount++;
        const startTime = Date.now();
        
        const { 
          text, 
          source_language = 'RU', 
          target_language = 'DE' 
        } = req.body;

        if (!text || text.trim() === '') {
          return res.status(400).json({
            error: 'Текст для перевода не указан'
          });
        }

        console.log(`📥 Запрос #${this.requestCount}: "${text}" (${source_language} → ${target_language})`);

        // Проверяем кэш
        const cacheKey = `${text.trim()}_${source_language}_${target_language}`;
        if (this.translationCache.has(cacheKey)) {
          const cached = this.translationCache.get(cacheKey);
          console.log('🔄 Перевод из кэша');
          return res.json({
            ...cached,
            from_cache: true,
            processing_time_ms: Date.now() - startTime
          });
        }

        // Нормализуем коды языков (DashkaBot использует ru/de, а наш сервис RU/DE)
        const sourceCode = source_language.toUpperCase();
        const targetCode = target_language.toUpperCase();

        // Выполняем перевод
        const result = await this.translationService.translateText(
          text.trim(), 
          sourceCode, 
          targetCode
        );

        // Формируем ответ в формате совместимом с DashkaBot
        const response = {
          original_text: result.originalText,
          translated_text: result.translatedText,
          source_language: sourceCode.toLowerCase(),
          target_language: targetCode.toLowerCase(),
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
          processing_time_ms: result.processingTime,
          mode: 'openai-gpt4o-mini',
          provider: result.provider,
          from_cache: false
        };

        // Сохраняем в кэш
        this.translationCache.set(cacheKey, response);
        
        // Ограничиваем размер кэша
        if (this.translationCache.size > 1000) {
          const firstKey = this.translationCache.keys().next().value;
          this.translationCache.delete(firstKey);
        }

        console.log(`📤 Перевод: "${result.translatedText}"`);
        res.json(response);

      } catch (error) {
        console.error('❌ Ошибка перевода:', error);
        res.status(500).json({
          error: `Ошибка сервера: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Голосовой перевод
    this.app.post('/translate-voice', this.upload.single('audio'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'Аудио файл не загружен' });
        }

        const { 
          source_language = 'RU', 
          target_language = 'DE' 
        } = req.body;

        console.log('🎤 Голосовой перевод:', { source_language, target_language });

        const result = await this.translationService.translateVoice(
          req.file.path,
          source_language.toUpperCase(),
          target_language.toUpperCase()
        );

        // Отправляем аудио файл
        if (fs.existsSync(result.translatedAudio)) {
          res.json({
            original_text: result.originalText,
            translated_text: result.translatedText,
            audio_url: `/audio/${path.basename(result.translatedAudio)}`,
            processing_time_ms: result.processingTime,
            confidence: result.confidence
          });
        } else {
          throw new Error('Не удалось создать аудио файл');
        }

        // Очищаем временный файл
        fs.unlinkSync(req.file.path);

      } catch (error) {
        console.error('❌ Ошибка голосового перевода:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
      }
    });

    // Определение языка
    this.app.post('/detect-language', async (req, res) => {
      try {
        const { text } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'Текст не указан' });
        }

        const result = await this.translationService.detectLanguage(text);
        res.json(result);

      } catch (error) {
        console.error('❌ Ошибка определения языка:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Поддерживаемые языки
    this.app.get('/languages', (req, res) => {
      const languages = this.translationService.getSupportedLanguages();
      res.json({
        supported_languages: languages,
        count: languages.length,
        service: 'UnifiedTranslationService'
      });
    });

    // Статистика - совместимость с DashkaBot
    this.app.get('/stats', (req, res) => {
      res.json({
        requests_processed: this.requestCount,
        cache_size: this.translationCache.size,
        supported_languages: Object.keys(this.translationService.supportedLanguages),
        mode: 'production',
        openai_configured: true,
        service_stats: this.translationService.getStats(),
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      });
    });

    // Раздача аудио файлов
    this.app.use('/audio', express.static(path.join(__dirname, 'audio_output')));

    // Корневой маршрут
    this.app.get('/', (req, res) => {
      res.json({
        service: 'DashkaBot AI Server (Node.js)',
        version: '3.0.0',
        status: 'running',
        endpoints: [
          'GET /health - Проверка состояния',
          'POST /translate - Текстовый перевод',
          'POST /translate-voice - Голосовой перевод',
          'POST /detect-language - Определение языка',
          'GET /languages - Поддерживаемые языки',
          'GET /stats - Статистика'
        ],
        languages: Object.keys(this.translationService.supportedLanguages).length
      });
    });
  }

  async start() {
    try {
      // Создаем необходимые директории
      const dirs = ['temp', 'audio_output'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      this.server = this.app.listen(this.port, () => {
        console.log('🚀 DashkaBot Node.js Server запущен!');
        console.log(`🔗 Доступен на: http://localhost:${this.port}`);
        console.log('📋 Endpoints:');
        console.log(`   GET  http://localhost:${this.port}/health`);
        console.log(`   POST http://localhost:${this.port}/translate`);
        console.log(`   POST http://localhost:${this.port}/translate-voice`);
        console.log(`   GET  http://localhost:${this.port}/languages`);
        console.log(`   GET  http://localhost:${this.port}/stats`);
        console.log(`🌍 Поддерживаемые языки: ${Object.keys(this.translationService.supportedLanguages).join(', ')}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      console.error('❌ Ошибка запуска сервера:', error);
      process.exit(1);
    }
  }

  shutdown() {
    console.log('🛑 Получен сигнал завершения...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Сервер остановлен');
        
        // Очистка временных файлов
        try {
          const tempFiles = fs.readdirSync('temp');
          tempFiles.forEach(file => {
            fs.unlinkSync(path.join('temp', file));
          });
        } catch (err) {
          console.log('Очистка temp директории:', err.message);
        }
        
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Запуск сервера
if (require.main === module) {
  const server = new DashkaBotNodeServer();
  server.start();
}

module.exports = { DashkaBotNodeServer };