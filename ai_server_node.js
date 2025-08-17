// DashkaBot Node.js Server - ИСПРАВЛЕННАЯ ВЕРСИЯ
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Проверяем API ключ
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('ваш-ключ')) {
    console.error('❌ OPENAI_API_KEY не настроен!');
    console.error('📝 Отредактируйте файл .env и укажите ваш OpenAI API ключ');
    process.exit(1);
}

console.log('✅ OpenAI API ключ найден:', process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.slice(-4));

// Инициализация OpenAI клиента
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('dashkabot_web'));

// Статистика
let stats = {
    totalRequests: 0,
    successfulTranslations: 0,
    errors: 0,
    startTime: new Date(),
    status: 'production'
};

// Функция перевода с OpenAI
async function translateWithOpenAI(text, fromLang, toLang) {
    const langMap = {
        'RU': 'Russian',
        'EN': 'English', 
        'DE': 'German',
        'ES': 'Spanish',
        'FR': 'French',
        'IT': 'Italian',
        'PT': 'Portuguese',
        'PL': 'Polish',
        'CS': 'Czech'
    };

    const sourceLang = langMap[fromLang] || fromLang;
    const targetLang = langMap[toLang] || toLang;

    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translation without any additional comments or explanations:

"${text}"`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator. Translate accurately and naturally from ${sourceLang} to ${targetLang}. Return only the translation.`
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.3,
        });

        const translatedText = completion.choices[0].message.content.trim();
        
        return {
            originalText: text,
            translatedText: translatedText,
            fromLang: fromLang,
            toLang: toLang,
            confidence: 0.95,
            model: 'gpt-4o-mini'
        };

    } catch (error) {
        console.error('OpenAI Translation Error:', error);
        throw new Error(`OpenAI API Error: ${error.message}`);
    }
}

// API Routes
app.get('/api/stats', (req, res) => {
    try {
        res.json({
            status: 'success',
            stats: {
                ...stats,
                uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000)
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Ошибка получения статистики'
        });
    }
});

app.get('/api/languages', (req, res) => {
    try {
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
    } catch (error) {
        console.error('Languages error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Ошибка получения языков'
        });
    }
});

app.post('/api/translate', async (req, res) => {
    console.log('🔄 Получен запрос на перевод:', req.body);
    
    try {
        stats.totalRequests++;
        const { text, fromLang, toLang } = req.body;

        // Валидация входных данных
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            stats.errors++;
            return res.status(400).json({
                status: 'error',
                message: 'Параметр text обязателен и должен содержать текст'
            });
        }

        if (!fromLang || !toLang) {
            stats.errors++;
            return res.status(400).json({
                status: 'error',
                message: 'Параметры fromLang и toLang обязательны'
            });
        }

        const supportedLangs = ['RU', 'EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'PL', 'CS'];
        if (!supportedLangs.includes(fromLang) || !supportedLangs.includes(toLang)) {
            stats.errors++;
            return res.status(400).json({
                status: 'error',
                message: `Поддерживаемые языки: ${supportedLangs.join(', ')}`
            });
        }

        console.log(`📝 Перевожу "${text}" с ${fromLang} на ${toLang}...`);

        // Выполняем перевод
        const result = await translateWithOpenAI(text.trim(), fromLang, toLang);
        stats.successfulTranslations++;

        console.log('✅ Перевод успешен:', result.translatedText);

        res.json({
            status: 'success',
            translation: result
        });

    } catch (error) {
        stats.errors++;
        console.error('❌ Ошибка перевода:', error);
        
        // Определяем тип ошибки для пользователя
        let userMessage = 'Ошибка при выполнении перевода';
        
        if (error.message.includes('API')) {
            userMessage = 'Ошибка API OpenAI: ' + error.message;
        } else if (error.message.includes('network')) {
            userMessage = 'Ошибка сети при подключении к OpenAI';
        } else if (error.message.includes('quota')) {
            userMessage = 'Превышена квота API OpenAI';
        }

        res.status(500).json({
            status: 'error',
            message: userMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Простой endpoint для тестирования
app.get('/api/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'DashkaBot API работает!',
        timestamp: new Date().toISOString(),
        openai: !!process.env.OPENAI_API_KEY
    });
});

// Корневой маршрут - редирект на web интерфейс
app.get('/', (req, res) => {
    res.redirect('/index_simple.html');
});

// Обработка несуществующих маршрутов
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint не найден',
        availableEndpoints: [
            'GET /api/stats',
            'GET /api/languages', 
            'POST /api/translate',
            'GET /api/test'
        ]
    });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
    console.error('🚨 Необработанная ошибка:', error);
    stats.errors++;
    
    res.status(500).json({
        status: 'error',
        message: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
    });
});

// Запуск сервера
const server = app.listen(PORT, () => {
    console.log('🚀 DashkaBot AI Server запущен на порту', PORT);
    console.log('🌐 Web интерфейс: http://localhost:' + PORT);
    console.log('🤖 API endpoint: http://localhost:' + PORT + '/api/');
    console.log('📊 Статус: Реальные OpenAI сервисы активны');
    console.log('🧪 Тест: http://localhost:' + PORT + '/api/test');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен сигнал завершения, закрываем сервер...');
    server.close(() => {
        console.log('✅ Сервер закрыт');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 Получен Ctrl+C, закрываем сервер...');
    server.close(() => {
        console.log('✅ Сервер закрыт');
        process.exit(0);
    });
});

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
    console.error('🚨 Необработанное исключение:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Необработанный reject:', reason);
    process.exit(1);
});
