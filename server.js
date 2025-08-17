// Исправленный DashkaBot сервер
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Проверяем OpenAI ключ
let OPENAI_API_KEY = '';
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/OPENAI_API_KEY=(.+)/);
    if (match) {
        OPENAI_API_KEY = match[1].trim();
    }
} catch (e) {
    console.log('⚠️ .env файл не найден, используем тестовый режим');
}

// Исправленная функция перевода
async function translateText(text, fromLang, toLang) {
    // Проверяем наличие ключа
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here' || OPENAI_API_KEY === '') {
        // Тестовый режим - простые переводы
        const translations = {
            'Добрый день': 'Guten Tag',
            'Привет': 'Hallo',
            'Спасибо': 'Danke',
            'До свидания': 'Auf Wiedersehen',
            'Как дела?': 'Wie geht es dir?',
            'Меня зовут': 'Ich heiße',
            'Guten Tag': 'Добрый день',
            'Hallo': 'Привет',
            'Danke': 'Спасибо',
            'Auf Wiedersehen': 'До свидания',
            'Wie geht es dir?': 'Как дела?',
            'Ich heiße': 'Меня зовут'
        };
        
        return translations[text] || `[ТЕСТ] ${fromLang}→${toLang}: ${text}`;
    }
    
    try {
        // Реальный вызов OpenAI API
        console.log('🤖 Отправляем запрос к OpenAI...');
        
        const requestBody = JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Ты профессиональный переводчик. Переведи текст с ${fromLang === 'RU' ? 'русского' : 'немецкого'} на ${toLang === 'DE' ? 'немецкий' : 'русский'}. Отвечай только переводом без объяснений.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        });

        // Создаем HTTP запрос к OpenAI
        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.error) {
                            console.error('OpenAI Error:', response.error);
                            resolve(`[ОШИБКА] ${response.error.message}`);
                            return;
                        }
                        
                        if (response.choices && response.choices.length > 0) {
                            const translation = response.choices[0].message.content.trim();
                            console.log(`✅ OpenAI перевод: ${translation}`);
                            resolve(translation);
                        } else {
                            console.error('Неожиданный ответ от OpenAI:', response);
                            resolve(`[ОШИБКА] Неожиданный ответ от OpenAI`);
                        }
                    } catch (parseError) {
                        console.error('Ошибка парсинга ответа OpenAI:', parseError);
                        resolve(`[ОШИБКА] Не удалось обработать ответ`);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('Ошибка запроса к OpenAI:', error);
                resolve(`[ОШИБКА] Сетевая ошибка: ${error.message}`);
            });
            
            req.write(requestBody);
            req.end();
        });
        
    } catch (error) {
        console.error('Общая ошибка перевода:', error);
        return `[ОШИБКА] ${error.message}`;
    }
}

// HTTP сервер
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API endpoints
    if (pathname === '/api/test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'success',
            message: 'DashkaBot работает!',
            mode: OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'OpenAI' : 'Test',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    if (pathname === '/api/translate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { text, fromLang, toLang } = data;
                
                if (!text || !text.trim()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'error',
                        message: 'Текст не указан'
                    }));
                    return;
                }
                
                console.log(`🔄 Перевод: "${text}" (${fromLang} → ${toLang})`);
                
                const translation = await translateText(text.trim(), fromLang, toLang);
                
                console.log(`✅ Результат: "${translation}"`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'success',
                    translation: {
                        originalText: text,
                        translatedText: translation,
                        fromLang,
                        toLang,
                        confidence: 0.95
                    }
                }));
            } catch (error) {
                console.error('Ошибка обработки запроса:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Ошибка сервера: ' + error.message
                }));
            }
        });
        return;
    }
    
    // Статические файлы
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, 'dashkabot_web', filePath);
    
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json'
        }[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(filePath));
    } else {
        res.writeHead(404);
        res.end('File not found');
    }
});

// Запуск HTTP сервера
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 DashkaBot HTTP сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте: http://172.20.10.4:${PORT}`);
    console.log(`💻 Локально: http://localhost:${PORT}`);
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here' || OPENAI_API_KEY === '') {
        console.log('⚠️ OpenAI ключ не настроен - работаем в тестовом режиме');
        console.log('📝 Для реального перевода добавьте ваш ключ в .env файл');
        console.log('💡 Тестовые фразы: "Добрый день", "Привет", "Спасибо"');
    } else {
        console.log('✅ OpenAI ключ настроен - используем реальный перевод');
    }
});

// HTTPS сервер (если есть сертификаты)
if (fs.existsSync('ssl/cert.pem') && fs.existsSync('ssl/key.pem')) {
    const httpsOptions = {
        key: fs.readFileSync('ssl/key.pem'),
        cert: fs.readFileSync('ssl/cert.pem')
    };
    
    const httpsServer = https.createServer(httpsOptions, (req, res) => {
        // Используем ту же логику что и HTTP сервер
        server.emit('request', req, res);
    });
    
    httpsServer.listen(8443, () => {
        console.log('🔒 DashkaBot HTTPS сервер запущен на порту 8443');
        console.log('📱 HTTPS: https://172.20.10.4:8443');
    });
}
