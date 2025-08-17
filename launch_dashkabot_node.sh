#!/bin/bash

# DashkaBot Node.js Launch Script
echo "🚀 DashkaBot - Система синхронного голосового перевода (Node.js)"
echo "====================================================="
echo "⏰ Запуск: $(date)"
echo "📁 Директория: $(pwd)"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не найден! Установите Node.js 16+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Требуется Node.js 16+, найден $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm не найден!${NC}"
    exit 1
fi

# Загрузка переменных окружения
if [ -f ".env" ]; then
    echo -e "${BLUE}🔧 Загрузка .env файла...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
    
    if [ -n "$OPENAI_API_KEY" ]; then
        echo -e "${GREEN}✅ OpenAI API ключ загружен: ${OPENAI_API_KEY:0:10}...${OPENAI_API_KEY: -4}${NC}"
    else
        echo -e "${YELLOW}⚠️ OpenAI API ключ не найден в .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ .env файл не найден${NC}"
fi

# Проверка ключевых файлов
REQUIRED_FILES=("UnifiedTranslationService.js" "whisperService.js" "textToSpeechService.js")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Отсутствуют файлы:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo -e "${YELLOW}💡 Скопируйте файлы из вашего проекта переводчика${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Все необходимые файлы найдены${NC}"

# Установка зависимостей
if [ ! -d "node_modules" ] || [ ! -f "package.json" ]; then
    echo -e "${BLUE}📦 Установка зависимостей...${NC}"
    
    # Создаем package.json если его нет
    if [ ! -f "package.json" ]; then
        echo -e "${YELLOW}📝 Создание package.json...${NC}"
        cat > package.json << 'EOF'
{
  "name": "dashkabot-ai-server",
  "version": "3.0.0",
  "description": "DashkaBot AI Translation Server",
  "main": "ai_server_node.js",
  "scripts": {
    "start": "node ai_server_node.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.20.1"
  }
}
EOF
    fi
    
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Ошибка установки зависимостей${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
fi

# Остановка существующих процессов
echo -e "${BLUE}🛑 Остановка существующих процессов...${NC}"
pkill -f "node.*ai_server" 2>/dev/null || true
pkill -f "python.*ai_server" 2>/dev/null || true

# Освобождение портов
PORTS=(8080 8765 8090)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}🔓 Освобождение порта $port (PID: $PID)${NC}"
        kill $PID 2>/dev/null || true
        sleep 1
    fi
done

# Создание необходимых директорий
echo -e "${BLUE}📁 Создание директорий...${NC}"
mkdir -p temp audio_output logs

# Запуск AI Server (Node.js)
echo ""
echo -e "${GREEN}🤖 Запуск AI Server (Node.js) на порту 8080...${NC}"

if [ ! -f "ai_server_node.js" ]; then
    echo -e "${RED}❌ Файл ai_server_node.js не найден!${NC}"
    echo -e "${YELLOW}💡 Создайте файл из артефакта в чате${NC}"
    exit 1
fi

# Запуск в фоне с логированием
node ai_server_node.js > logs/ai_server.log 2>&1 &
AI_SERVER_PID=$!
echo $AI_SERVER_PID > .ai_server.pid

# Проверка запуска AI Server
sleep 3
if kill -0 $AI_SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ AI Server запущен (PID: $AI_SERVER_PID)${NC}"
else
    echo -e "${RED}❌ Ошибка запуска AI Server${NC}"
    echo "Логи:"
    tail -10 logs/ai_server.log
    exit 1
fi

# Запуск WebSocket Server
echo -e "${GREEN}🔌 Запуск WebSocket Server на порту 8765...${NC}"

if [ -f "websocket_server.py" ]; then
    python3 websocket_server.py > logs/websocket.log 2>&1 &
    WS_SERVER_PID=$!
    echo $WS_SERVER_PID > .ws_server.pid
    
    sleep 2
    if kill -0 $WS_SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✅ WebSocket Server запущен (PID: $WS_SERVER_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️ WebSocket Server не запустился${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ websocket_server.py не найден, пропускаем${NC}"
fi

# Запуск Web Server
echo -e "${GREEN}🌐 Запуск Web Server на порту 8090...${NC}"

if [ -f "web_server.py" ]; then
    python3 web_server.py > logs/web_server.log 2>&1 &
    WEB_SERVER_PID=$!
    echo $WEB_SERVER_PID > .web_server.pid
    
    sleep 2
    if kill -0 $WEB_SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Web Server запущен (PID: $WEB_SERVER_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️ Web Server не запустился${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ web_server.py не найден, пропускаем${NC}"
fi

# Финальная проверка
echo ""
echo -e "${BLUE}🔍 Проверка состояния серверов...${NC}"
sleep 3

# Проверка AI Server
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI Server отвечает на http://localhost:8080${NC}"
    
    # Показываем статистику
    STATS=$(curl -s http://localhost:8080/stats 2>/dev/null)
    if [ ! -z "$STATS" ]; then
        echo -e "${BLUE}📊 Поддерживаемые языки: $(echo $STATS | grep -o '"supported_languages":\[[^]]*\]' | grep -o '"[^"]*"' | wc -l)${NC}"
    fi
else
    echo -e "${RED}❌ AI Server не отвечает${NC}"
fi

# Проверка Web Server
if curl -s http://localhost:8090 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web Interface доступен на http://localhost:8090${NC}"
else
    echo -e "${YELLOW}⚠️ Web Interface недоступен${NC}"
fi

echo ""
echo -e "${GREEN}🎉 DashkaBot запущен!${NC}"
echo -e "${BLUE}🔗 Доступные URL:${NC}"
echo "   🌐 Web Interface: http://localhost:8090"
echo "   🤖 AI Server API: http://localhost:8080"
echo "   🔌 WebSocket: ws://localhost:8765"
echo ""
echo -e "${BLUE}📋 Управление:${NC}"
echo "   Остановить: pkill -f dashkabot"
echo "   Логи AI: tail -f logs/ai_server.log"
echo "   Статус: curl http://localhost:8080/health"
echo ""
echo -e "${YELLOW}💡 Для остановки нажмите Ctrl+C${NC}"

# Функция очистки при завершении
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Остановка серверов...${NC}"
    
    # Остановка всех процессов
    [ -f .ai_server.pid ] && kill $(cat .ai_server.pid) 2>/dev/null && rm .ai_server.pid
    [ -f .ws_server.pid ] && kill $(cat .ws_server.pid) 2>/dev/null && rm .ws_server.pid  
    [ -f .web_server.pid ] && kill $(cat .web_server.pid) 2>/dev/null && rm .web_server.pid
    
    echo -e "${GREEN}✅ Все серверы остановлены${NC}"
    exit 0
}

# Обработка сигналов завершения
trap cleanup SIGINT SIGTERM

# Ожидание
echo -e "${BLUE}⏳ Ожидание... (Ctrl+C для остановки)${NC}"
while true; do
    sleep 5
    
    # Проверяем, что процессы еще живы
    if [ -f .ai_server.pid ] && ! kill -0 $(cat .ai_server.pid) 2>/dev/null; then
        echo -e "${RED}❌ AI Server остановился неожиданно${NC}"
        tail -10 logs/ai_server.log
        break
    fi
    
done