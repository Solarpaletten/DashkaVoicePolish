const express = require('express');
const cors = require('cors');
const app = express();

// ✅ ДОБАВЛЯЕМ JSON PARSER - ЭТО БЫЛА ПРОБЛЕМА!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://dashkabot.swapoil.de',
      'https://api.dashkabot.swapoil.de',
      'http://localhost:8090'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DashkaBot Cloud Server',
    version: '3.0.0',
    openai_configured: !!process.env.OPENAI_API_KEY,
    cors_enabled: true,
    json_parser_enabled: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ✅ ПЕРЕВОД ТЕКСТА - ТЕПЕРЬ req.body БУДЕТ РАБОТАТЬ!
app.post('/translate', async (req, res) => {
  try {
    console.log('📥 Получен запрос:', req.body);
    
    const { text, source_language, target_language } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // MOCK ПЕРЕВОДЫ (пока тестируем)
    const translations = {
      'Привет': 'Hallo',
      'Как дела?': 'Wie geht es dir?',
      'Добрый день': 'Guten Tag',
      'Спасибо': 'Danke',
      'Пока': 'Tschüss'
    };
    
    const mockTranslation = translations[text] || `[${target_language}] ${text}`;
    
    const result = {
      original_text: text,
      translated_text: mockTranslation,
      source_language: source_language,
      target_language: target_language,
      service: 'DashkaBot Mock',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Отправляем ответ:', result);
    res.json(result);
    
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DashkaBot AI Server FINAL running on port ${PORT}`);
  console.log(`✅ JSON Parser: ENABLED`);
  console.log(`✅ CORS: ENABLED`);
  console.log(`✅ OpenAI: ${!!process.env.OPENAI_API_KEY}`);
});
