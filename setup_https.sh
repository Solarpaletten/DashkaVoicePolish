#!/bin/bash
# 🔒 Setup HTTPS server for microphone access

echo "🔒 Настройка HTTPS сервера для микрофона"
echo "========================================"

# Создаем самоподписанный сертификат
echo "📜 Создание SSL сертификата..."
mkdir -p ssl

# Генерируем сертификат
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=DE/ST=Berlin/L=Berlin/O=DashkaBot/CN=172.20.10.4"

if [ $? -eq 0 ]; then
    echo "✅ SSL сертификат создан"
else
    echo "❌ Ошибка создания сертификата"
    echo "💡 Устанавливаем OpenSSL..."
    brew install openssl
    /usr/local/opt/openssl/bin/openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=DE/ST=Berlin/L=Berlin/O=DashkaBot/CN=172.20.10.4"
fi

# Создаем HTTPS сервер на Node.js
cat > https_server.js << 'EOF'
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();

// Статические файлы
app.use(express.static('dashkabot_web'));

// Настройка HTTPS
const options = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

const port = 8443;

https.createServer(options, app).listen(port, '0.0.0.0', () => {
    console.log('🔒 HTTPS сервер запущен:');
    console.log(`   https://172.20.10.4:${port}`);
    console.log(`   https://localhost:${port}`);
    console.log('');
    console.log('⚠️  Нужно принять самоподписанный сертификат в браузере!');
});
EOF

echo "✅ HTTPS сервер настроен"

# Запускаем HTTPS сервер
echo "🚀 Запуск HTTPS сервера..."
node https_server.js > logs/https_server.log 2>&1 &
HTTPS_PID=$!
echo $HTTPS_PID > run/https_server.pid

sleep 2

if kill -0 $HTTPS_PID 2>/dev/null; then
    echo "✅ HTTPS сервер запущен (PID: $HTTPS_PID)"
    echo ""
    echo "🔗 НОВЫЕ ССЫЛКИ С HTTPS:"
    echo "• 💻 Компьютер: https://localhost:8443"
    echo "• 📱 Телефон: https://172.20.10.4:8443"
    echo ""
    echo "⚠️  ВАЖНО: При первом открытии нажмите 'Дополнительно' → 'Перейти на сайт'"
    echo "🎤 После этого микрофон должен работать!"
else
    echo "❌ Ошибка запуска HTTPS сервера"
fi