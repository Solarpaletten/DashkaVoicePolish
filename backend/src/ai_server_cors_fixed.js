const express = require('express');
const cors = require('cors');
const app = express();

// CORS конфигурация
app.use(cors({
  origin: ['https://dashkabot.swapoil.de', 'https://api.dashkabot.swapoil.de'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Обработка preflight
app.options('*', cors());

// Здесь должен быть весь остальной код AI сервера...
// Пока создадим простой health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DashkaBot Cloud Server',
    version: '3.0.0',
    openai_configured: true
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Server running on port ${PORT}`);
});
