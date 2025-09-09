#!/usr/bin/env bash
set -euo pipefail

echo "🔧 AI IT SOLAR - Исправление путей импортов"
echo "==========================================="

# Исправляем пути в unifiedTranslationService.js
echo "📝 Исправляем unifiedTranslationService.js..."
if [ -f "src/unifiedTranslationService.js" ]; then
    # Замена ../whisperService на ./whisperService
    sed -i '' 's|require('"'"'../whisperService'"'"')|require('"'"'./whisperService'"'"')|g' src/unifiedTranslationService.js
    
    # Замена ../textToSpeechService на ./textToSpeechService  
    sed -i '' 's|require('"'"'../textToSpeechService'"'"')|require('"'"'./textToSpeechService'"'"')|g' src/unifiedTranslationService.js
    
    echo "   ✅ Пути обновлены"
else
    echo "   ❌ Файл не найден"
fi

# Проверяем все .js файлы на неправильные импорты
echo ""
echo "🔍 Проверяем другие файлы на неправильные пути..."

# Ищем все require с ../ в src/
find src/ -name "*.js" -exec grep -l "require.*\.\./" {} \; 2>/dev/null | while read file; do
    echo "📝 Исправляем $file..."
    
    # Общие замены для всех файлов в src/
    sed -i '' 's|require('"'"'\.\./|require('"'"'\./|g' "$file"
    
    echo "   ✅ Пути обновлены в $file"
done

# Проверяем что все нужные файлы существуют
echo ""
echo "🔍 Проверяем наличие зависимостей..."
required_files=(
    "whisperService.js"
    "textToSpeechService.js" 
    "unifiedTranslationService.js"
)

for file in "${required_files[@]}"; do
    if [ -f "src/$file" ]; then
        echo "   ✅ $file найден"
    else
        echo "   ❌ $file отсутствует"
    fi
done

echo ""
echo "✅ Пути импортов исправлены!"
echo "🎯 Пробуем запустить сервер..."