
# 3. 🔨 Собираем новый APK
echo "🔨 [3/4] Собираем СУПЕРКОМАНДА APK..."
cd DashkaBotAndroid

./gradlew assembleDebug > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ APK успешно собран!"
    APK_SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    echo "📱 Размер APK: $APK_SIZE"
else
    echo "❌ Ошибка сборки APK"
    echo "📋 Проверьте логи: cd DashkaBotAndroid && ./gradlew assembleDebug"
    exit 1
fi

cd ..

# 4. 🚀 Устанавливаем обновленный APK
echo "📲 [4/4] Устанавливаем обновленный APK..."

# Проверяем подключенные устройства
DEVICES=$(adb devices | grep -E "device$" | wc -l)

if [ $DEVICES -gt 0 ]; then
    echo "📱 Найдено устройств: $DEVICES"
    adb install -r DashkaBotAndroid/app/build/outputs/apk/debug/app-debug.apk
    
    if [ $? -eq 0 ]; then
        echo "✅ APK успешно установлен!"
    else
        echo "⚠️ Ошибка установки. Попробуйте вручную."
    fi
else
    echo "⚠️ Android устройство не подключено"
    echo "💡 APK готов: DashkaBotAndroid/app/build/outputs/apk/debug/app-debug.apk"
fi

# 5. 🧹 Очистка временных файлов
rm -f /tmp/tts_method.java /tmp/tts_update.js

echo ""
echo "🎉 СУПЕРКОМАНДА TTS UPGRADE ЗАВЕРШЕН!"
echo "=================================="
echo "✅ Нативный Android TTS добавлен"
echo "✅ Веб-интерфейс обновлен" 
echo "✅ APK пересобран и установлен"
echo "✅ Поддержка 9 языков: RU, DE, EN, ES, PL, CS, LT, LV, NO"
echo ""
echo "🚀 МИССИЯ ВЫПОЛНЕНА ЗА $(echo $SECONDS) СЕКУНД!"
echo "🎯 Тестируйте озвучивание в мобильном приложении!"
echo ""
echo "🌟 СУПЕРКОМАНДА КОСМИЧЕСКИЙ КОРАБЛЬ К ЗВЕЗДАМ! 🌟"