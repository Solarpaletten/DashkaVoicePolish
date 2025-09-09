#!/usr/bin/env bash
set -euo pipefail

echo "🔧 AI IT SOLAR - Исправление ES Modules конфликта"
echo "================================================"

# Удаляем conflicting package.json из src/
if [ -f "src/package.json" ]; then
    echo "🗑️ Удаляем конфликтующий src/package.json"
    rm src/package.json
fi

if [ -f "src/package-lock.json" ]; then
    echo "🗑️ Удаляем конфликтующий src/package-lock.json" 
    rm src/package-lock.json
fi

# Создаем симлинк ai_server_node.js на рабочий файл
if [ ! -f "src/ai_server_node.js" ]; then
    echo "🔗 Создаем ai_server_node.js симлинк"
    if [ -f "src/server.js" ]; then
        ln -sf server.js src/ai_server_node.js
        echo "   ✅ ai_server_node.js -> server.js"
    elif [ -f "src/ai_server_final.js" ]; then
        ln -sf ai_server_final.js src/ai_server_node.js
        echo "   ✅ ai_server_node.js -> ai_server_final.js"
    fi
fi

# Исправляем пути в server.js
echo "🔧 Исправляем пути импортов в server.js"
sed -i '' 's|require('"'"'../unifiedTranslationService'"'"')|require('"'"'./unifiedTranslationService'"'"')|g' src/server.js

# Проверяем что unifiedTranslationService.js на месте
if [ ! -f "src/unifiedTranslationService.js" ]; then
    echo "⚠️ Отсутствует unifiedTranslationService.js в src/"
    echo "📁 Ищем в других местах..."
    find . -name "unifiedTranslationService.js" -type f 2>/dev/null || echo "   Не найден"
fi

# Обновляем .env с правильными настройками
cat >> .env << 'EOF'

# Backend Module System
MODULE_TYPE=commonjs
EOF

echo ""
echo "✅ Конфликт модулей исправлен!"
echo "🎯 Теперь запускаем:"
echo "   npm run dev"