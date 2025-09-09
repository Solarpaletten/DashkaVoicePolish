// 🎯 DASHKA LANGUAGE CONFIGURATION GUIDE
// =====================================

// 📍 ОСНОВНОЙ ФАЙЛ ДЛЯ ИЗМЕНЕНИЙ:
// frontend/index.html - ЭТО ГЛАВНЫЙ ФАЙЛ!

// 🔧 Где менять PL на DE (Polish → German):

// 1. КОНФИГУРАЦИЯ ЯЗЫКОВ (строки ~25-30)
const LANGUAGE_CONFIG = {
    source: {
        code: 'RU',
        flag: '🇷🇺',
        name: 'Russian Speaker',
        speechLang: 'ru-RU'
    },
    target: {
        code: 'DE',           // ИЗМЕНИТЬ: было 'PL'
        flag: '🇩🇪',          // ИЗМЕНИТЬ: было '🇵🇱' 
        name: 'German Speaker', // ИЗМЕНИТЬ: было 'Polish Speaker'
        speechLang: 'de-DE'   // ИЗМЕНИТЬ: было 'pl-PL'
    }
};

// 2. ЗАГОЛОВОК ПРИЛОЖЕНИЯ (строка ~180)
'<title>Russian ⇄ German Voice Translator</title>' // было Polish

// 3. ОСНОВНОЙ ЗАГОЛОВОК (строка ~200)
'Russian ⇄ German Voice Translator' // было Polish

// 4. ПЕРЕКЛЮЧАТЕЛЬ РОЛЕЙ (строки ~250-260)
'🇩🇪 German Speaker'  // было '🇵🇱 Polish Speaker'

// 5. ЛОГИКА ПЕРЕВОДА (строки ~400-420)
const getSourceLanguage = () => currentRole === 'user' ? 'RU' : 'DE'; // было PL
const getTargetLanguage = () => currentRole === 'user' ? 'DE' : 'RU'; // было PL

// 6. SPEECH RECOGNITION LANGUAGE (строки ~500-520)
const speechLang = currentRole === 'user' ? 'ru-RU' : 'de-DE'; // было pl-PL

// 🗂️ ФАЙЛЫ КОТОРЫЕ НЕ НУЖНО ТРОГАТЬ:
// ❌ frontend/src/legacy/index.html - старая версия
// ❌ frontend/dist/index.html - автогенерируется при npm run build
// ❌ frontend/polish_language_config.js - можно удалить

// 🔥 БЫСТРАЯ ЗАМЕНА ЧЕРЕЗ SED:
/*
cd frontend

# Заменяем все Polish на German
sed -i '' 's/Polish/German/g' index.html
sed -i '' 's/🇵🇱/🇩🇪/g' index.html  
sed -i '' 's/PL/DE/g' index.html
sed -i '' 's/pl-PL/de-DE/g' index.html

# Проверяем изменения
grep -n "German\|DE\|🇩🇪" index.html
*/

// 🚀 РЕЗУЛЬТАТ ПОСЛЕ ЗАМЕНЫ:
// ✅ Russian ⇄ German Voice Translator
// ✅ Russian Speaker 🇷🇺 ↔ German Speaker 🇩🇪  
// ✅ Переводы RU → DE и DE → RU
// ✅ Голосовое распознавание немецкого языка
// ✅ Backend поддерживает DE (проверьте логи: "9 языков")

// 📁 ОЧИСТКА ПРОЕКТА:
/*
# Удаляем ненужные файлы
rm frontend/polish_language_config.js
rm -rf frontend/src/legacy/  # если не используется

# Очищаем dist (пересоздастся при сборке)
rm -rf frontend/dist/
npm run build  # пересоздаст dist с новыми настройками
*/

// 🎯 ИТОГО: РАБОТАЕМ ТОЛЬКО С frontend/index.html
// Остальные файлы - либо устаревшие, либо генерируемые автоматически!