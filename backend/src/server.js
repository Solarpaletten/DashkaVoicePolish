const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UnifiedTranslationService } = require('./unifiedTranslationService');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

class DashkaBotNodeServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8080;
    this.translationService = new UnifiedTranslationService();
    this.requestCount = 0;
    this.translationCache = new Map();
    

    // ✅ НОВОЕ: WebSocket сервер
    this.clients = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();  // ✅ Добавляем WebSocket
    
    console.log('🤖 DashkaBot Node.js Server инициализирован');
  }

  // ✅ НОВАЯ ФУНКЦИЯ: Настройка WebSocket
  setupWebSocket() {
    // Создаем HTTP сервер для Express
    this.server = http.createServer(this.app);
    
    // Создаем WebSocket сервер на том же порту
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'  // WebSocket на /ws path
    });
    
    this.wss.on('connection', (ws, request) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.clients.set(clientId, {
        ws: ws,
        role: 'unknown',
        connected_at: new Date()
      });

      console.log(`🔗 WebSocket подключение: ${clientId} (всего: ${this.clients.size})`);

      // Приветственное сообщение
      ws.send(JSON.stringify({
        type: 'welcome',
        client_id: clientId,
        message: 'Подключение к DashkaBot Cloud успешно!',
        timestamp: new Date().toISOString()
      }));

      // Обработка сообщений
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          data.sender_id = clientId;
          data.timestamp = new Date().toISOString();

          console.log(`📨 WebSocket сообщение от ${clientId}:`, data.type);

          // Обработка разных типов сообщений
          switch (data.type) {
            case 'set_role':
              this.setClientRole(clientId, data.role);
              break;
            case 'translation':
              this.broadcastTranslation(clientId, data);
              break;
            default:
              this.broadcastToOthers(clientId, data);
          }
        } catch (error) {
          console.error(`❌ Ошибка WebSocket сообщения от ${clientId}:`, error);
        }
      });

      // Отключение
      ws.on('close', () => {
        console.log(`❌ WebSocket отключение: ${clientId} (осталось: ${this.clients.size - 1})`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket ошибка для ${clientId}:`, error);
      });
    });
  }

  // Установка роли клиента
  setClientRole(clientId, role) {
    if (this.clients.has(clientId)) {
      this.clients.get(clientId).role = role;
      console.log(`👤 Клиент ${clientId} установил роль: ${role}`);
      
      // Подтверждение установки роли
      this.clients.get(clientId).ws.send(JSON.stringify({
        type: 'role_confirmed',
        role: role,
        timestamp: new Date().toISOString()
      }));
    }
  }

  // Трансляция перевода
  broadcastTranslation(senderId, data) {
    console.log(`🌍 Трансляция перевода от ${senderId}`);
    
    const message = {
      ...data,
      sender_role: this.clients.get(senderId)?.role || 'unknown',
      sender_id: senderId
    };

    this.broadcastToOthers(senderId, message);
  }

  // Трансляция другим клиентам
  broadcastToOthers(senderId, data) {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(data));
          sentCount++;
        } catch (error) {
          console.error(`❌ Ошибка отправки сообщения ${clientId}:`, error);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Сообщение отправлено ${sentCount} клиентам`);
    }
  }

  setupMiddleware() {
    // CORS для веб-интерфейса и мобильного
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // JSON парсер
    this.app.use(express.json({ limit: '10mb' }));

    // Статические файлы веб-интерфейса  
    this.app.use(express.static(path.join(__dirname, 'dashkabot_web')));
    
    // Multer для загрузки аудио файлов
    const upload = multer({
      dest: 'temp/',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Только аудио файлы разрешены'));
        }
      }
    });
    
    this.upload = upload;

    // Логирование запросов
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  setupRoutes() {
    // ✅ ГЛАВНАЯ СТРАНИЦА - ОТДАЕМ HTML
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashkabot_web', 'index.html'));
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'DashkaBot Cloud Server',
        version: '3.0.0',
        websocket_clients: this.clients.size,
        requests_processed: this.requestCount,
        supported_languages: Object.keys(this.translationService.supportedLanguages).length,
        openai_configured: !!process.env.OPENAI_API_KEY,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      });
    });

    // API Info - для разработчиков
    this.app.get('/api', (req, res) => {
      res.json({
        service: 'DashkaBot AI Server (Node.js)',
        version: '3.0.0',
        status: 'running',
        endpoints: [
          'GET /health - Проверка состояния',
          'POST /translate - Текстовый перевод',
          'POST /voice-translate - Голосовой перевод',
          'POST /detect-language - Определение языка',
          'GET /languages - Поддерживаемые языки',
          'GET /stats - Статистика',
          'GET /test - Тестовый endpoint'
        ],
        websocket: 'wss://dashka-translate.onrender.com/ws',
        supported_languages: Object.keys(this.translationService.supportedLanguages).length,
        openai_configured: !!process.env.OPENAI_API_KEY
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
          target_language = 'DE',
          fromLang,
          toLang,
          from,
          to
        } = req.body;

        // Поддержка разных форматов параметров
        const sourceCode = source_language || fromLang || from || 'RU';
        const targetCode = target_language || toLang || to || 'DE';

        if (!text || text.trim() === '') {
          return res.status(400).json({
            status: 'error',
            message: 'Текст для перевода не указан'
          });
        }

        console.log(`📥 Запрос #${this.requestCount}: "${text.substring(0, 50)}..." (${sourceCode} → ${targetCode})`);

        // Проверяем кэш
        const cacheKey = `${text.trim()}_${sourceCode}_${targetCode}`;
        if (this.translationCache.has(cacheKey)) {
          const cached = this.translationCache.get(cacheKey);
          console.log('🔄 Перевод из кэша');
          return res.json({
            ...cached,
            from_cache: true,
            processing_time: Date.now() - startTime
          });
        }

        // Нормализуем коды языков
        const normalizedSource = sourceCode.toUpperCase();
        const normalizedTarget = targetCode.toUpperCase();

        // Выполняем перевод
        const result = await this.translationService.translateText(
          text.trim(), 
          normalizedSource, 
          normalizedTarget
        );

        // Формируем ответ в формате совместимом с DashkaBot
        const response = {
          status: 'success',
          original_text: result.originalText,
          translated_text: result.translatedText,
          source_language: normalizedSource.toLowerCase(),
          target_language: normalizedTarget.toLowerCase(),
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
          processing_time: result.processingTime,
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

        console.log(`📤 Перевод: "${result.translatedText.substring(0, 50)}..."`);
        res.json(response);

      } catch (error) {
        console.error('❌ Ошибка перевода:', error);
        res.status(500).json({
          status: 'error',
          message: `Ошибка сервера: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Голосовой перевод
    this.app.post('/voice-translate', this.upload.single('audio'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ 
            status: 'error',
            message: 'Аудио файл не загружен' 
          });
        }

        const { 
          fromLang = 'RU', 
          toLang = 'DE',
          source_language = 'RU',
          target_language = 'DE'
        } = req.body;

        const sourceCode = fromLang || source_language;
        const targetCode = toLang || target_language;

        console.log('🎤 Голосовой перевод:', { sourceCode, targetCode });

        const result = await this.translationService.translateVoice(
          req.file.path,
          sourceCode.toUpperCase(),
          targetCode.toUpperCase()
        );

        // Отправляем результат
        res.json({
          status: 'success',
          originalText: result.originalText,
          translatedText: result.translatedText,
          audioUrl: result.translatedAudio ? `/audio/${path.basename(result.translatedAudio)}` : null,
          fromLanguage: result.fromLanguage,
          toLanguage: result.toLanguage,
          processingTime: result.processingTime,
          confidence: result.confidence,
          provider: result.provider
        });

        // Очищаем временный файл
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

      } catch (error) {
        console.error('❌ Ошибка голосового перевода:', error);
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
          status: 'error',
          message: error.message 
        });
      }
    });

    // Определение языка
    this.app.post('/detect-language', async (req, res) => {
      try {
        const { text } = req.body;
        
        if (!text) {
          return res.status(400).json({ 
            status: 'error',
            message: 'Текст не указан' 
          });
        }

        const result = await this.translationService.detectLanguage(text);
        res.json({
          status: 'success',
          detected_language: result.language,
          confidence: result.confidence,
          provider: result.provider
        });

      } catch (error) {
        console.error('❌ Ошибка определения языка:', error);
        res.status(500).json({ 
          status: 'error',
          message: error.message 
        });
      }
    });

    // Поддерживаемые языки
    this.app.get('/languages', (req, res) => {
      const languages = this.translationService.getSupportedLanguages();
      res.json({
        status: 'success',
        count: languages.length,
        languages: languages,
        service: 'UnifiedTranslationService'
      });
    });

    // Статистика - совместимость с DashkaBot
    this.app.get('/stats', (req, res) => {
      res.json({
        status: 'success',
        stats: {
          requests_processed: this.requestCount,
          cache_size: this.translationCache.size,
          websocket_clients: this.clients.size,
          supported_languages: Object.keys(this.translationService.supportedLanguages).length,
          openai_configured: !!process.env.OPENAI_API_KEY,
          service_stats: this.translationService.getStats(),
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          version: '3.0.0'
        }
      });
    });

    // Раздача аудио файлов
    this.app.use('/audio', express.static(path.join(__dirname, 'tmp')));

    // Тестовый endpoint
    this.app.get('/test', (req, res) => {
      res.json({
        status: 'success',
        message: 'DashkaBot AI Server работает отлично!',
        websocket_url: 'wss://dashka-translate.onrender.com/ws',
        timestamp: new Date().toISOString(),
        version: '3.0.0'
      });
    });

    // 404 обработчик
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Endpoint не найден',
        available_endpoints: ['/health', '/translate', '/voice-translate', '/languages', '/stats']
      });
    });

    // Глобальный обработчик ошибок
    this.app.use((error, req, res, next) => {
      console.error('❌ Server error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Внутренняя ошибка сервера'
      });
    });
  }

  // ✅ ОБНОВЛЕННЫЙ start() метод
  start() {
    try {
      // Создаем необходимые директории
      const dirs = ['temp', 'tmp', 'uploads', 'cache', 'dashkabot_web'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Запускаем сервер с WebSocket поддержкой
      this.server.listen(this.port, "0.0.0.0", () => {
        console.log('🚀 DashkaBot Cloud Server запущен!');
        console.log(`🌍 URL: https://dashka-translate.onrender.com`);
        console.log(`🔗 Port: ${this.port}`);
        console.log(`🔌 WebSocket: wss://dashka-translate.onrender.com/ws`);
        console.log(`📱 Ready for mobile browsers with WebSocket sync!`);
        console.log(`🌍 Поддерживаемые языки: ${Object.keys(this.translationService.supportedLanguages).join(', ')}`);
        console.log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Настроен' : '❌ Не настроен'}`);
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
          ['temp', 'tmp'].forEach(dir => {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir);
              files.forEach(file => {
                try {
                  fs.unlinkSync(path.join(dir, file));
                } catch (err) {
                  // Игнорируем ошибки удаления
                }
              });
            }
          });
        } catch (err) {
          console.log('Очистка временных файлов:', err.message);
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