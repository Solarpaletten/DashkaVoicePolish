#!/bin/bash
# 🔧 Fix HTTPS API integration

echo "🔧 Исправление HTTPS + API интеграции"
echo "====================================="

# Останавливаем старый HTTPS сервер
echo "🛑 Остановка старого HTTPS сервера..."
if [ -f "run/https_server.pid" ]; then
    kill $(cat run/https_server.pid) 2>/dev/null
    rm run/https_server.pid
fi

# Создаем улучшенный HTTPS сервер с проксированием API
cat > https_api_server.js << 'EOF'
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();

// Middleware для JSON
app.use(express.json());

// CORS для HTTPS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Проксирование API запросов к основному серверу
app.use('/api', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: req.originalUrl,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'API недоступен' });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
});

// Статические файлы
app.use(express.static('dashkabot_web'));

// Настройка HTTPS
const options = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

const port = 8443;

https.createServer(options, app).listen(port, '0.0.0.0', () => {
    console.log('🔒 HTTPS API сервер запущен:');
    console.log('   https://172.20.10.4:8443');
    console.log('   https://localhost:8443');
    console.log('');
    console.log('✅ API проксирование настроено');
    console.log('🎤 Микрофон должен работать');
});
EOF

echo "✅ Улучшенный HTTPS сервер создан"

# Запускаем новый сервер
echo "🚀 Запуск HTTPS сервера с API..."
node https_api_server.js > logs/https_api_server.log 2>&1 &
HTTPS_PID=$!
echo $HTTPS_PID > run/https_server.pid

sleep 3

if kill -0 $HTTPS_PID 2>/dev/null; then
    echo "✅ HTTPS API сервер запущен (PID: $HTTPS_PID)"
    
    # Тестируем
    echo "🧪 Тестирование HTTPS API..."
    sleep 2
    
    TEST_RESULT=$(curl -k -s -X POST https://localhost:8443/api/translate \
      -H "Content-Type: application/json" \
      -d '{"text":"тест","fromLang":"RU","toLang":"DE"}')
    
    if echo "$TEST_RESULT" | grep -q "translation"; then
        echo "✅ HTTPS API работает!"
        echo "🎤 Перевод через HTTPS готов"
    else
        echo "⚠️ HTTPS API требует дополнительной настройки"
        echo "Ответ: $TEST_RESULT"
    fi
else
    echo "❌ Ошибка запуска HTTPS сервера"
fi

echo ""
echo "🔗 Обновленные ссылки:"
echo "• 📱 HTTPS с API: https://172.20.10.4:8443"
echo "• 💻 Локально: https://localhost:8443"
echo ""
echo "🔄 Обновите страницу на телефоне!"