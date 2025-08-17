#!/bin/bash

# DashkaBot - Полный запуск всех сервисов
# Автоматический запуск: AI Server + WebSocket + Web Interface

echo "🚀 DashkaBot - Полная система голосового перевода"
echo "=================================================="
echo "⏰ Запуск: $(date)"
echo "📁 Директория: $(pwd)"
echo "✅ Node.js: $(node -v)"
echo ""

# Проверяем .env файл
if [ -f ".env" ]; then
    echo "🔧 Загрузка .env файла..."
    export $(cat .env | xargs)
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "✅ OpenAI API ключ загружен: ${OPENAI_API_KEY:0:12}...${OPENAI_API_KEY: -4}"
    else
        echo "⚠️ OpenAI API ключ не найден в .env"
    fi
else
    echo "⚠️ .env файл не найден"
fi

# Проверяем все необходимые файлы
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file найден"
    else
        echo "❌ $file отсутствует!"
        exit 1
    fi
done

echo ""

# Останавливаем существующие процессы
echo "🛑 Остановка существующих процессов..."
pkill -f "node simple_web_server.js" 2>/dev/null || true  
pkill -f "node simple_websocket_server.js" 2>/dev/null || true
pkill -f "dashkabot" 2>/dev/null || true

# Освобождаем порты
for port in 8080 8090 8765 8766; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "🔓 Освобождение порта $port (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done

sleep 2

# Создаем директории
echo "📁 Создание директорий..."
mkdir -p logs dashkabot_web uploads cache

# Установка зависимостей если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

echo ""

# 1. Запуск AI Server
echo "🤖 Запуск AI Server на порту 8080..."
AI_PID=$!
sleep 3

if kill -0 $AI_PID 2>/dev/null; then
    echo "✅ AI Server запущен (PID: $AI_PID)"
else
    echo "❌ Ошибка запуска AI Server"
    echo "Логи:"
    tail -10 logs/ai_server.log
    exit 1
fi

# 2. Запуск WebSocket Server
echo "🔌 Запуск WebSocket Server на порту 8765..."
nohup node simple_websocket_server.js > logs/websocket.log 2>&1 &
WS_PID=$!
sleep 2

if kill -0 $WS_PID 2>/dev/null; then
    echo "✅ WebSocket Server запущен (PID: $WS_PID)"
else
    echo "❌ Ошибка запуска WebSocket Server"
    echo "Логи:"
    tail -10 logs/websocket.log
fi

# 3. Запуск Web Server
echo "🌐 Запуск Web Server на порту 8090..."
nohup node simple_web_server.js > logs/web_server.log 2>&1 &
WEB_PID=$!
sleep 2

if kill -0 $WEB_PID 2>/dev/null; then
    echo "✅ Web Server запущен (PID: $WEB_PID)"
else
    echo "❌ Ошибка запуска Web Server"
    echo "Логи:"
    tail -10 logs/web_server.log
fi

echo ""
echo "🔍 Проверка состояния серверов..."

# Проверка AI Server
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ AI Server отвечает на http://localhost:8080"
    LANGUAGES=$(curl -s http://localhost:8080/languages | jq -r '.count' 2>/dev/null || echo "N/A")
    echo "📊 Поддерживаемые языки: $LANGUAGES"
else
    echo "❌ AI Server недоступен"
fi

# Проверка WebSocket
if curl -s http://localhost:8766/health > /dev/null; then
    echo "✅ WebSocket Server отвечает на ws://localhost:8765"
else
    echo "⚠️ WebSocket Server недоступен"
fi

# Проверка Web Interface
if curl -s http://localhost:8090 > /dev/null; then
    echo "✅ Web Interface доступен на http://localhost:8090"
else
    echo "⚠️ Web Interface недоступен"
fi

echo ""
echo "🎉 DashkaBot запущен!"
echo ""
echo "🔗 Доступные URL:"
echo "   🌐 Web Interface: http://localhost:8090"
echo "   🤖 AI Server API: http://localhost:8080"  
echo "   🔌 WebSocket: ws://localhost:8765"
echo "   📊 WebSocket Health: http://localhost:8766/health"
echo ""
echo "📋 Управление:"
echo "   Остановить: pkill -f dashkabot"
echo "   Логи AI: tail -f logs/ai_server.log"
echo "   Логи WS: tail -f logs/websocket.log"
echo "   Логи Web: tail -f logs/web_server.log"
echo "   Статус: curl http://localhost:8080/health"
echo ""

# Запись PID для остановки
echo "$AI_PID:$WS_PID:$WEB_PID" > .dashkabot.pid

echo "💡 Для остановки нажмите Ctrl+C или выполните:"
echo "   ./stop_dashkabot.sh"
echo ""
echo "⏳ Все сервисы запущены и работают в фоне!"
echo "📱 Откройте браузер: http://localhost:8090"