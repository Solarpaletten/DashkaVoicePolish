#!/bin/bash

# DashkaBot - Скрипт остановки всех сервисов

echo "🛑 Остановка DashkaBot системы..."
echo "=================================="

# Останавливаем по PID файлам
if [ -f ".dashkabot_mobile.pid" ]; then
    echo "📋 Чтение PID файла..."
    PIDS=$(cat .dashkabot_mobile.pid)
    IFS=':' read -ra PID_ARRAY <<< "$PIDS"
    
    for pid in "${PID_ARRAY[@]}"; do
        if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
            echo "🔪 Остановка процесса PID: $pid"
            kill $pid
        fi
    done
    
    rm .dashkabot_mobile.pid
fi

# Останавливаем по именам процессов
echo "🔍 Поиск и остановка DashkaBot процессов..."

PROCESSES=(
    "ai_server_node.js"
    "simple_websocket_server.js" 
    "mobile_web_server.js"
    "simple_web_server.js"
    "websocket_server.js"
)

for process in "${PROCESSES[@]}"; do
    PIDS=$(pgrep -f "$process")
    if [ ! -z "$PIDS" ]; then
        echo "🔪 Остановка: $process (PIDs: $PIDS)"
        pkill -f "$process"
    fi
done

# Освобождаем порты принудительно
echo "🔓 Освобождение портов..."
PORTS=(8080 8090 8765 8766)

for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "🔪 Освобождение порта $port (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done

# Очистка PID файлов
echo "🧹 Очистка PID файлов..."
rm -f run/*.pid 2>/dev/null || true
rm -f .*.pid 2>/dev/null || true

# Очистка временных файлов
echo "🧹 Очистка временных файлов..."
TEMP_DIRS=("temp" "tmp" "uploads")

for dir in "${TEMP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "🗑️ Очистка $dir/"
        find "$dir" -type f -mmin +60 -delete 2>/dev/null || true
    fi
done

# Проверяем что все остановлено
sleep 2
echo ""
echo "🔍 Проверка остановки..."

REMAINING=$(pgrep -f "dashkabot\|ai_server\|websocket_server\|mobile_web" 2>/dev/null || true)

if [ -z "$REMAINING" ]; then
    echo "✅ Все процессы DashkaBot остановлены"
else
    echo "⚠️ Остались процессы: $REMAINING"
    echo "💀 Принудительная остановка..."
    echo "$REMAINING" | xargs -r kill -9 2>/dev/null || true
fi

# Проверяем порты
echo "🔍 Проверка портов..."
for port in "${PORTS[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "⚠️ Порт $port все еще занят"
    else
        echo "✅ Порт $port свободен"
    fi
done

echo ""
echo "🎯 DashkaBot остановлен!"
echo "📊 Логи сохранены в logs/"
echo "🔄 Для запуска: ./launch_dashkabot_mobile.sh"