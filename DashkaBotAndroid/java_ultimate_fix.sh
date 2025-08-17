#!/bin/bash
echo "🔥 SOLAR TEAM - ULTIMATE JAVA FIX"
echo "================================="

# 1. ПРОВЕРЯЕМ КАКАЯ JAVA УСТАНОВЛЕНА
echo "🔍 Проверяем Java installations..."
/usr/libexec/java_home -V 2>/dev/null || echo "❌ Java не найдена системой"

# 2. ПРОВЕРЯЕМ HOMEBREW JAVA
if brew list --versions openjdk >/dev/null 2>&1; then
    echo "✅ OpenJDK найден через Homebrew"
    JAVA_HOME_PATH=$(brew --prefix openjdk)
else
    echo "📦 Устанавливаем OpenJDK через Homebrew..."
    brew install openjdk
    JAVA_HOME_PATH=$(brew --prefix openjdk)
fi

# 3. НАСТРАИВАЕМ JAVA_HOME
echo "🔧 Настраиваем JAVA_HOME..."
export JAVA_HOME="$JAVA_HOME_PATH"
export PATH="$JAVA_HOME/bin:$PATH"

echo "JAVA_HOME=$JAVA_HOME"
echo "PATH includes: $(echo $PATH | grep -o '[^:]*java[^:]*' | head -1)"

# 4. ПРОВЕРЯЕМ РЕЗУЛЬТАТ
echo "✅ Тестируем Java:"
if "$JAVA_HOME/bin/java" -version 2>&1; then
    echo "🎉 JAVA РАБОТАЕТ!"
else
    echo "❌ Java всё ещё не работает"
    echo "🔧 Попробуем альтернативный способ..."
    
    # АЛЬТЕРНАТИВНЫЙ СПОСОБ - СКАЧИВАЕМ НАПРЯМУЮ
    echo "📥 Скачиваем Amazon Corretto JDK 17..."
    curl -L -o amazon-corretto-17.pkg \
        "https://corretto.aws/downloads/latest/amazon-corretto-17-aarch64-macos-jdk.pkg"
    
    echo "📦 Установи пакет amazon-corretto-17.pkg вручную"
    echo "🔧 Или используй системную Java:"
    
    # ИСПОЛЬЗУЕМ СИСТЕМНУЮ JAVA ЕСЛИ ЕСТЬ
    if [[ -d "/System/Library/Frameworks/JavaVM.framework/Home" ]]; then
        export JAVA_HOME="/System/Library/Frameworks/JavaVM.framework/Home"
        echo "🔄 Переключаемся на системную Java"
    fi
fi

# 5. ОБНОВЛЯЕМ SHELL PROFILE
echo "🔧 Обновляем ~/.zshrc..."
grep -q "JAVA_HOME" ~/.zshrc || {
    echo "" >> ~/.zshrc
    echo "# Java для Android Studio" >> ~/.zshrc
    echo "export JAVA_HOME=\"$JAVA_HOME\"" >> ~/.zshrc
    echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.zshrc
}

# 6. СОЗДАЁМ GRADLE WRAPPER С JAVA CHECK
cat > gradlew << 'EOF'
#!/usr/bin/env sh

# Попытка найти Java
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA_CMD="$JAVA_HOME/bin/java"
elif command -v java >/dev/null 2>&1; then
    JAVA_CMD="java"
else
    echo "❌ Java не найдена! Установи Java:"
    echo "   brew install openjdk"
    echo "   export JAVA_HOME=\$(brew --prefix openjdk)"
    exit 1
fi

# Запуск Gradle
APP_HOME="$(pwd -P)"
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"

exec "$JAVA_CMD" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
EOF

chmod +x gradlew

echo ""
echo "🎯 ФИНАЛЬНАЯ ПРОВЕРКА:"
echo "JAVA_HOME: $JAVA_HOME"
echo "Java версия:"
"$JAVA_HOME/bin/java" -version 2>&1 || echo "❌ Нужно установить Java"

echo ""
echo "🚀 КОМАНДЫ ДЛЯ ПРОДОЛЖЕНИЯ:"
echo "1. source ~/.zshrc"
echo "2. ./gradlew --version"
echo "3. ./gradlew clean"
echo "4. ./gradlew assembleDebug"

echo ""
echo "💡 ЕСЛИ JAVA ВСЁ ЕЩЁ НЕ РАБОТАЕТ:"
echo "   brew install openjdk@17"
echo "   sudo ln -sfn \$(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
