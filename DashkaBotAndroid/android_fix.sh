#!/bin/bash
echo "🚀 SOLAR IT TEAM - ИСПРАВЛЯЕМ ANDROID ПРОЕКТ"
echo "=================================================="

# 1. ИСПРАВЛЯЕМ SETTINGS.GRADLE
cat > settings.gradle << 'EOF'
pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
include ':app'
rootProject.name = "DashkaBotAndroid"
EOF

# 2. ИСПРАВЛЯЕМ ROOT BUILD.GRADLE
cat > build.gradle << 'EOF'
// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id 'com.android.application' version '8.1.2' apply false
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

# 3. ИСПРАВЛЯЕМ APP BUILD.GRADLE
cat > app/build.gradle << 'EOF'
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.dashkabot.voicetranslator'
    compileSdk 34

    defaultConfig {
        applicationId "com.dashkabot.voicetranslator"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    buildFeatures {
        viewBinding true
        buildConfig true
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.10.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.webkit:webkit:1.8.0'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
EOF

# 4. ИСПРАВЛЯЕМ GRADLE.PROPERTIES
cat > gradle.properties << 'EOF'
# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true

# AndroidX package structure to make it clearer which packages are bundled with the
# Android operating system, and which are packaged with your app's APK
android.useAndroidX=true
# Enables namespacing of each library's R class so that its R class includes only the
# resources declared in the library itself and none from the library's dependencies,
# thereby reducing the size of the R class for that library
android.nonTransitiveRClass=true

# Gradle 8.x compatibility
android.enableJetifier=true
org.gradle.caching=true
org.gradle.configuration-cache=true
EOF

# 5. СОЗДАЕМ GRADLE WRAPPER PROPERTIES
mkdir -p gradle/wrapper
cat > gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# 6. СОЗДАЕМ PROGUARD RULES
cat > app/proguard-rules.pro << 'EOF'
# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
-keep public class * extends android.app.Activity
-keep public class * extends android.webkit.WebView
EOF

# 7. ПРОВЕРЯЕМ JAVA
echo "🔍 ПРОВЕРЯЕМ JAVA..."
if command -v java &> /dev/null; then
    echo "✅ Java найдена: $(java -version 2>&1 | head -1)"
else
    echo "❌ Java НЕ НАЙДЕНА!"
    echo "🔧 УСТАНАВЛИВАЕМ JAVA через Homebrew..."
    if command -v brew &> /dev/null; then
        brew install openjdk@17
        export JAVA_HOME=$(brew --prefix openjdk@17)
        export PATH="$JAVA_HOME/bin:$PATH"
        echo "export JAVA_HOME=\$(brew --prefix openjdk@17)" >> ~/.zshrc
        echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.zshrc
        echo "✅ Java 17 установлена!"
    else
        echo "❌ Homebrew не найден. Установи Java вручную:"
        echo "   brew install openjdk@17"
    fi
fi

echo "🎉 ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ!"
echo "🚀 ТЕПЕРЬ ЗАПУСКАЙ:"
echo "   source ~/.zshrc  # Обновить PATH"
echo "   ./gradlew clean"
echo "   ./gradlew assembleDebug"
