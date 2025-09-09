const express = require('express');
const cors = require('cors');
const app = express();

// ✅ ПРАВИЛЬНЫЙ CORS - ТОЛЬКО ОДИН ЗАГОЛОВОК
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

// ✅ ЗДОРОВЬЕ СЕРВЕРА
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DashkaBot Cloud Server',
    version: '3.0.0',
    openai_configured: !!process.env.OPENAI_API_KEY,
    cors_enabled: true,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// ✅ ПЕРЕВОД ТЕКСТА
app.post('/translate', async (req, res) => {
  try {
    const { text, source_language, target_language } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // MOCK перевод пока тестируем CORS
    const mockTranslation = text === 'Привет' ? 'Hallo' : 
                           text === 'Как дела?' ? 'Wie geht es dir?' :
                           `[${target_language}] ${text}`;
    
    res.json({
      original_text: text,
      translated_text: mockTranslation,
      source_language: source_language,
      target_language: target_language,
      service: 'DashkaBot',
      timestamp: new Date().toISOString()
    });
    
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
  console.log(`🚀 DashkaBot AI Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for: https://dashkabot.swapoil.de`);
  console.log(`✅ OpenAI configured: ${!!process.env.OPENAI_API_KEY}`);
});
