#!/bin/bash
# 🔍 Debug DashkaBot System Logs

echo "🔍 Диагностика логов DashkaBot"
echo "============================="

# Проверка статуса сервисов
echo "📊 Статус сервисов:"
echo "==================="

# AI Server
if curl -s http://localhost:8080/api/test > /dev/null; then
    echo "✅ AI Server (8080): Работает"
else
    echo "❌ AI Server (8080): Недоступен"
fi

# HTTPS Server
if curl -k -s https://localhost:8443 > /dev/null; then
    echo "✅ HTTPS Server (8443): Работает"
else
    echo "❌ HTTPS Server (8443): Недоступен"
fi

# WebSocket
if curl -s http://localhost:8766/health > /dev/null; then
    echo "✅ WebSocket Server (8765): Работает"
else
    echo "⚠️  WebSocket Server (8765): Недоступен"
fi

echo ""
echo "📝 Логи серверов:"
echo "=================="

# AI Server логи
echo "🧠 AI Server логи (последние 10 строк):"
if [ -f "logs/ai_server.log" ]; then
    tail -10 logs/ai_server.log
    echo ""
else
    echo "❌ Файл logs/ai_server.log не найден"
fi

# HTTPS Server логи
echo "🔒 HTTPS Server логи (последние 10 строк):"
if [ -f "logs/https_server.log" ]; then
    tail -10 logs/https_server.log
    echo ""
else
    echo "❌ Файл logs/https_server.log не найден"
fi

# Проверка процессов
echo "🔄 Активные процессы DashkaBot:"
echo "==============================="
ps aux | grep -E "(node|python3)" | grep -v grep | grep -E "(ai_server|https_server|websocket)"

echo ""
echo "🧪 Тест API перевода:"
echo "====================="

# Тест перевода через API
echo "📝 Тестируем перевод RU→DE:"
TRANSLATION_RESULT=$(curl -s -X POST http://localhost:8080/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Привет мир","fromLang":"RU","toLang":"DE"}')

echo "Ответ API:"
echo "$TRANSLATION_RESULT"
echo ""

if echo "$TRANSLATION_RESULT" | grep -q "translation"; then
    echo "✅ API перевода работает"
else
    echo "❌ API перевода не работает"
    echo "🔍 Проверяем детали..."
    
    # Проверяем OpenAI ключ
    if grep -q "your-openai-api-key-here" .env 2>/dev/null; then
        echo "❌ OpenAI API ключ не настроен в .env файле!"
    else
        echo "✅ OpenAI API ключ настроен"
    fi
fi

echo ""
echo "🌐 Тест HTTPS API:"
echo "=================="

# Тест через HTTPS
HTTPS_TEST=$(curl -k -s -X POST https://localhost:8443/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","fromLang":"RU","toLang":"DE"}' 2>&1)

echo "HTTPS API ответ:"
echo "$HTTPS_TEST"

echo ""
echo "📱 Информация для отладки:"
echo "=========================="
echo "• Локальные URL: http://localhost:8080, https://localhost:8443"
echo "• Мобильные URL: http://172.20.10.4:8080, https://172.20.10.4:8443"
echo "• Веб-интерфейс: http://localhost:8090, https://172.20.10.4:8443"
echo ""
echo "🔧 Команды для исправления:"
echo "============================"
echo "• Перезапуск AI сервера: pkill -f ai_server_node.js && node ai_server_node.js &"
echo "• Проверка .env файла: cat .env | grep OPENAI"
echo "• Просмотр логов в реальном времени: tail -f logs/*.log"