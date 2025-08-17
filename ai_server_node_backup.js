// DashkaBot Node.js Server with Environment Variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Проверяем API ключ
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('ваш-ключ')) {
    console.error('❌ OPENAI_API_KEY не настроен!');
    console.error('📝 Отредактируйте файл .env и укажите ваш OpenAI API ключ');
    process.exit(1);
}

console.log('✅ OpenAI API ключ найден:', process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.slice(-4));

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dashkabot_web'));

// Импортируем сервисы после проверки API ключа
let unifiedTranslationService, whisperService, textToSpeechService;

try {
    unifiedTranslationService = require('./unifiedTranslationService.js');
    console.log('✅ Translation Service загружен');
} catch (error) {
    console.error('❌ Ошибка загрузки Translation Service:', error.message);
    process.exit(1);
}

try {
    whisperService = require('./whisperService.js');
    console.log('🎤 Whisper Service инициализирован');
} catch (error) {
    console.error('❌ Ошибка загрузки Whisper Service:', error.message);
    whisperService = null;
}

try {
    textToSpeechService = require('./textToSpeechService.js');
    console.log('🔊 Text-to-Speech Service инициализирован');
} catch (error) {
    console.error('❌ Ошибка загрузки TTS Service:', error.message);
    textToSpeechService = null;
}

// Статистика
let stats = {
    totalRequests: 0,
    successfulTranslations: 0,
    errors: 0,
    startTime: new Date(),
    status: 'production'
};

// API Routes
app.get('/api/stats', (req, res) => {
    res.json({
        status: 'success',
        stats: {
            ...stats,
            uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000)
        }
    });
});

app.get('/api/languages', (req, res) => {
    const languages = [
        { code: 'RU', name: 'Русский' },
        { code: 'EN', name: 'English' },
        { code: 'DE', name: 'Deutsch' },
        { code: 'ES', name: 'Español' },
        { code: 'FR', name: 'Français' },
        { code: 'IT', name: 'Italiano' },
        { code: 'PT', name: 'Português' },
        { code: 'PL', name: 'Polski' },
        { code: 'CS', name: 'Čeština' }
    ];
    
    res.json({
        status: 'success',
        languages
    });
});

app.post('/api/translate', async (req, res) => {
    try {
        stats.totalRequests++;
        const { text, fromLang, toLang } = req.body;

        if (!text || !fromLang || !toLang) {
            stats.errors++;
            return res.status(400).json({
                status: 'error',
                message: 'Требуются параметры: text, fromLang, toLang'
            });
        }

        const result = await unifiedTranslationService.translateText(text, fromLang, toLang);
        stats.successfulTranslations++;

        res.json({
            status: 'success',
            translation: result
        });

    } catch (error) {
        stats.errors++;
        console.error('Ошибка перевода:', error);
        res.status(500).json({
            status: 'error',
            message: 'Ошибка при выполнении перевода'
        });
    }
});

app.post('/api/voice-translate', async (req, res) => {
    try {
        if (!whisperService) {
            return res.status(503).json({
                status: 'error',
                message: 'Whisper Service недоступен'
            });
        }

        stats.totalRequests++;
        // Здесь будет обработка аудио файлов
        res.json({
            status: 'success',
            message: 'Voice translation endpoint готов'
        });

    } catch (error) {
        stats.errors++;
        console.error('Ошибка голосового перевода:', error);
        res.status(500).json({
            status: 'error',
            message: 'Ошибка голосового перевода'
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('🚀 DashkaBot AI Server запущен на порту', PORT);
    console.log('🌐 Web интерфейс: http://localhost:' + PORT);
    console.log('🤖 API endpoint: http://localhost:' + PORT + '/api/');
    console.log('📊 Статус: Реальные OpenAI сервисы активны');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен сигнал завершения, закрываем сервер...');
    process.exit(0);
});
