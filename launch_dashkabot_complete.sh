#!/bin/bash

# DashkaBot Mobile - Полный запуск для Android
# Автоматический запуск всех компонентов системы

echo "📱 DashkaBot Mobile - Система голосового перевода"
echo "=================================================="
echo "⏰ Запуск: $(date)"
echo "📁 Директория: $(pwd)"
echo "✅ Node.js: $(node -v 2>/dev/null || echo 'НЕ УСТАНОВЛЕН')"
echo ""

# Проверяем .env файл
if [ -f ".env" ]; then
    echo "🔧 Загрузка .env файла..."
    export $(grep -v '^#' .env | xargs)
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "✅ OpenAI API ключ загружен: ${OPENAI_API_KEY:0:12}...***"
    else
        echo "⚠️ OpenAI API ключ не найден в .env"
    fi
else
    echo "⚠️ .env файл не найден"
    echo "💡 Создайте .env файл с OPENAI_API_KEY=your_key_here"
fi

echo ""

# Проверяем файлы
FILES=(
    "ai_server_node.js"
    "simple_websocket_server.js"
    "mobile_web_server.js"
    "unifiedTranslationService.js"
    "whisperService.js"
    "textToSpeechService.js"
    "package.json"
)

echo "🔍 Проверка файлов..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file ОТСУТСТВУЕТ!"
        MISSING_FILES=true
    fi
done

if [ "$MISSING_FILES" = true ]; then
    echo ""
    echo "❌ Некоторые файлы отсутствуют. Проверьте структуру проекта."
    exit 1
fi

echo ""

# Останавливаем существующие процессы
echo "🛑 Остановка существующих процессов..."
pkill -f "node ai_server_node.js" 2>/dev/null || true
pkill -f "node simple_websocket_server.js" 2>/dev/null || true
pkill -f "node mobile_web_server.js" 2>/dev/null || true
pkill -f "dashkabot" 2>/dev/null || true

# Освобождаем порты
PORTS=(8080 8090 8765 8766)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "🔓 Освобождение порта $port (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done

sleep 2

# Создаем директории
echo "📁 Создание директорий..."
mkdir -p logs dashkabot_web temp tmp uploads cache audio_output run

# Проверяем Node.js зависимости
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки зависимостей"
        exit 1
    fi
fi

echo ""
echo "🚀 Запуск серверов..."

# 1. Запуск AI Server
echo "🤖 Запуск AI Server на 0.0.0.0:8080..."
nohup node ai_server_node.js > logs/ai_server.log 2>&1 &
AI_PID=$!
echo $AI_PID > run/ai_server.pid
sleep 4

if kill -0 $AI_PID 2>/dev/null; then
    echo "✅ AI Server запущен (PID: $AI_PID)"
else
    echo "❌ Ошибка запуска AI Server"
    echo "📋 Последние строки лога:"
    tail -10 logs/ai_server.log
    exit 1
fi

# 2. Запуск WebSocket Server
echo "🔌 Запуск WebSocket Server на 0.0.0.0:8765..."
nohup node simple_websocket_server.js > logs/websocket.log 2>&1 &
WS_PID=$!
echo $WS_PID > run/websocket.pid
sleep 3

if kill -0 $WS_PID 2>/dev/null; then
    echo "✅ WebSocket Server запущен (PID: $WS_PID)"
else
    echo "❌ Ошибка запуска WebSocket Server"
    echo "📋 Последние строки лога:"
    tail -10 logs/websocket.log
fi

# 3. Запуск Mobile Web Server
echo "📱 Запуск Mobile Web Server на 0.0.0.0:8090..."
nohup node mobile_web_server.js > logs/mobile_web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > run/web_server.pid
sleep 3

if kill -0 $WEB_PID 2>/dev/null; then
    echo "✅ Mobile Web Server запущен (PID: $WEB_PID)"
else
    echo "❌ Ошибка запуска Mobile Web Server"
    echo "📋 Последние строки лога:"
    tail -10 logs/mobile_web.log
fi

echo ""
echo "🔍 Проверка работоспособности серверов..."

# Проверка AI Server
sleep 2
if curl -s --connect-timeout 5 http://0.0.0.0:8080/health > /dev/null 2>&1; then
    echo "✅ AI Server отвечает на http://0.0.0.0:8080"
    # Получаем информацию о языках
    LANG_INFO=$(curl -s http://0.0.0.0:8080/languages 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "📊 Поддерживаемые языки: ${LANG_INFO:-'N/A'}"
else
    echo "❌ AI Server недоступен на http://0.0.0.0:8080"
fi

# Проверка WebSocket
if curl -s --connect-timeout 5 http://0.0.0.0:8766/health > /dev/null 2>&1; then
    echo "✅ WebSocket Server отвечает на ws://0.0.0.0:8765"
else
    echo "⚠️ WebSocket Server недоступен"
fi

# Проверка Web Server
if curl -s --connect-timeout 5 http://0.0.0.0:8090 > /dev/null 2>&1; then
    echo "✅ Mobile Web Server доступен на http://0.0.0.0:8090"
else
    echo "⚠️ Mobile Web Server недоступен"
fi

echo ""
echo "🎉 DashkaBot Mobile система запущена!"
echo ""
echo "🔗 Мобильные URL (для Android APK):"
echo "   📱 Web Interface: http://0.0.0.0:8090"
echo "   🤖 AI API: http://0.0.0.0:8080"
echo "   🔌 WebSocket: ws://0.0.0.0:8765"
echo ""
echo "🔗 Локальные URL (для разработки):"
echo "   🌐 Web Interface: http://localhost:8090"
echo "   🤖 AI API: http://localhost:8080"
echo "   🔌 WebSocket: ws://localhost:8765"
echo "   📊 WebSocket Stats: http://localhost:8766/health"
echo ""
echo "📋 Управление:"
echo "   🛑 Остановить все: pkill -f dashkabot"
echo "   📋 Логи AI: tail -f logs/ai_server.log"
echo "   📋 Логи WS: tail -f logs/websocket.log" 
echo "   📋 Логи Web: tail -f logs/mobile_web.log"
echo "   🔍 Тест AI: curl http://0.0.0.0:8080/test"
echo ""
echo "📱 Android APK:"
echo "   1. Соберите APK: cd DashkaBotAndroid && ./gradlew assembleDebug"
echo "   2. Установите на устройство в той же Wi-Fi сети"
echo "   3. APK подключится к http://0.0.0.0:8090"
echo ""

# Сохраняем PID для управления
echo "$AI_PID:$WS_PID:$WEB_PID" > .dashkabot_mobile.pid

echo "💡 Система работает в фоне. Для остановки:"
echo "   ./stop_dashkabot.sh"
echo ""
echo "🚀 Готово к использованию!"

# Показываем статус
echo ""
echo "📊 Статус системы:"
ps aux | grep -E "(ai_server_node|simple_websocket|mobile_web)" | grep -v grep || echo "Процессы не найдены"