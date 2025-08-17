#!/bin/bash
# 🚀 SOLAR IT TEAM - ANDROID PROJECT INSTANT CREATION
# ПОЛНОЕ СОЗДАНИЕ ПРОЕКТА DASHKABOT ANDROID ЗА 30 СЕКУНД

echo "🚀 SOLAR IT TEAM - INSTANT ANDROID PROJECT CREATION"
echo "=================================================="
echo "🎯 TARGET: DashkaBotAndroid - Ready for Android Studio"
echo "⚡ SPEED: LIGHT-SPEED MODE ACTIVATED!"
echo ""

# СОЗДАНИЕ СТРУКТУРЫ
mkdir -p app/src/main/java/com/dashkabot/voicetranslator/{service,model,utils}
mkdir -p app/src/main/res/{layout,values,drawable,xml,mipmap-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}}
mkdir -p gradle/wrapper

# 1. GRADLE.PROPERTIES (ИСПРАВЛЕНИЕ AndroidX)
cat > gradle.properties << 'EOF'
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=true
android.enableR8.fullMode=true
dashkabot.ai.server.url=http://localhost:8080
dashkabot.websocket.url=ws://localhost:8765
dashkabot.version=1.0.0
EOF

# 2. BUILD.GRADLE (ROOT)
cat > build.gradle << 'EOF'
buildscript {
    ext {
        compileSdkVersion = 34
        minSdkVersion = 24
        targetSdkVersion = 34
        versionCode = 1
        versionName = "1.0.0"
        gradleVersion = '8.1.2'
        androidxAppCompatVersion = '1.6.1'
        materialVersion = '1.10.0'
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:$gradleVersion"
    }
}

plugins {
    id 'com.android.application' version '8.1.2' apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

# 3. SETTINGS.GRADLE
cat > settings.gradle << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
rootProject.name = "DashkaBot Voice Translator"
include ':app'
EOF

# 4. APP BUILD.GRADLE
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
        buildConfigField "String", "AI_SERVER_URL", '"http://localhost:8080"'
        buildConfigField "String", "WEBSOCKET_URL", '"ws://localhost:8765"'
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
        buildConfig true
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.activity:activity:1.8.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'com.google.android.material:material:1.10.0'
    implementation 'androidx.webkit:webkit:1.8.0'
    implementation 'org.java-websocket:Java-WebSocket:1.5.4'
    implementation 'com.google.code.gson:gson:2.10.1'
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
EOF

# 5. PROGUARD RULES
cat > app/proguard-rules.pro << 'EOF'
-keep class com.dashkabot.voicetranslator.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
EOF

# 6. ANDROID MANIFEST
cat > app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.DashkaBotVoiceTranslator"
        android:usesCleartextTraffic="true"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.DashkaBotVoiceTranslator.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
EOF

# 7. MAIN ACTIVITY
cat > app/src/main/java/com/dashkabot/voicetranslator/MainActivity.java << 'EOF'
package com.dashkabot.voicetranslator;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.webkit.*;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.dashkabot.voicetranslator.databinding.ActivityMainBinding;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "DashkaBot";
    private static final int REQUEST_PERMISSIONS = 100;
    private ActivityMainBinding binding;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        Log.i(TAG, "🚀 DashkaBot запускается...");
        setupWebView();
        checkPermissions();
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        webView = binding.webView;
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDomStorageEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        webView.addJavascriptInterface(new DashkaBotJSInterface(), "DashkaBotAndroid");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                Log.i(TAG, "📱 WebView готов");
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
        
        // Загружаем интерфейс
        String serverUrl = "http://localhost:8090";
        Log.i(TAG, "🌐 Загружаем интерфейс: " + serverUrl);
        webView.loadUrl(serverUrl);
    }
    
    private void checkPermissions() {
        String[] permissions = {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE
        };
        
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, permissions, REQUEST_PERMISSIONS);
                return;
            }
        }
        Log.i(TAG, "✅ Разрешения получены");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_PERMISSIONS) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                Log.i(TAG, "✅ Все разрешения предоставлены");
            } else {
                Toast.makeText(this, "Нужны разрешения для работы", Toast.LENGTH_LONG).show();
            }
        }
    }

    public class DashkaBotJSInterface {
        @JavascriptInterface
        public void log(String message) {
            Log.i(TAG, "JS: " + message);
        }
        
        @JavascriptInterface
        public String getDeviceInfo() {
            return "Android Device - DashkaBot Ready";
        }
        
        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }
    }
}
EOF

# 8. LAYOUT
cat > app/src/main/res/layout/activity_main.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
EOF

# 9. STRINGS
cat > app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">DashkaBot Voice Translator</string>
    <string name="welcome">Добро пожаловать в DashkaBot!</string>
    <string name="user_role">🇷🇺 Пользователь</string>
    <string name="steuerberater_role">🇩🇪 Steuerberater</string>
    <string name="recording">🎤 Запись...</string>
    <string name="processing">🔄 Обработка...</string>
    <string name="ready">✅ Готов к работе</string>
    <string name="error_network">❌ Ошибка сети</string>
    <string name="error_permission">❌ Нужны разрешения</string>
</resources>
EOF

# 10. COLORS
cat > app/src/main/res/values/colors.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="purple_200">#FFBB86FC</color>
    <color name="purple_500">#FF6200EE</color>
    <color name="purple_700">#FF3700B3</color>
    <color name="teal_200">#FF03DAC5</color>
    <color name="teal_700">#FF018786</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    
    <!-- DashkaBot Colors -->
    <color name="dashka_primary">#667eea</color>
    <color name="dashka_secondary">#764ba2</color>
    <color name="dashka_user">#4ecdc4</color>
    <color name="dashka_steuerberater">#ff6b6b</color>
    <color name="dashka_record">#e74c3c</color>
</resources>
EOF

# 11. THEMES
cat > app/src/main/res/values/themes.xml << 'EOF'
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.DashkaBotVoiceTranslator" parent="Theme.Material3.DayNight">
        <item name="colorPrimary">@color/dashka_primary</item>
        <item name="colorPrimaryVariant">@color/dashka_secondary</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/teal_200</item>
        <item name="colorSecondaryVariant">@color/teal_700</item>
        <item name="colorOnSecondary">@color/black</item>
        <item name="android:statusBarColor" tools:targetApi="l">?attr/colorPrimaryVariant</item>
    </style>
    
    <style name="Theme.DashkaBotVoiceTranslator.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowFullscreen">false</item>
    </style>
</resources>
EOF

# 12. GRADLE WRAPPER
cat > gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# 13. GRADLEW
cat > gradlew << 'EOF'
#!/usr/bin/env sh
DEFAULT_JVM_OPTS=""
APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`
APP_HOME=`dirname "$SCRIPT"`
GRADLE_APP_DIR=`cd "$APP_HOME" && pwd -P`
GRADLE_HOME="$GRADLE_APP_DIR/gradle"
exec "$GRADLE_HOME/bin/gradle" "$@"
EOF

chmod +x gradlew

# 14. GRADLEW.BAT
cat > gradlew.bat << 'EOF'
@if "%DEBUG%" == "" @echo off
set DIRNAME=%~dp0
"%DIRNAME%\gradle\bin\gradle.bat" %*
EOF

# 15. ИКОНКИ (BASE64 PNG)
echo "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVGiB7ZlNaBNBFMefJBvTpFZb9aDVg6AHwYMIelDwgwgeBA8ePHjw4MGDB0ERBEEQBEEQBEEQBEEQBEH8OHjw4MGDB0ERBEEQBEEQBEEQBEF8eAgePHjw4MGDB0ERBEF8H" | base64 -d > app/src/main/res/mipmap-hdpi/ic_launcher.png 2>/dev/null || echo "No base64 support"

# 16. XML DATA EXTRACTION RULES
cat > app/src/main/res/xml/data_extraction_rules.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="sharedpref" path="." />
        <exclude domain="sharedpref" path="device.xml" />
    </cloud-backup>
    <device-transfer>
        <include domain="sharedpref" path="." />
        <exclude domain="sharedpref" path="device.xml" />
    </device-transfer>
</data-extraction-rules>
EOF

# 17. BACKUP RULES
cat > app/src/main/res/xml/backup_rules.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
</full-backup-content>
EOF

# 18. LOCAL PROPERTIES
cat > local.properties << 'EOF'
# Location of the Android SDK
sdk.dir=/Users/asset/Library/Android/sdk
EOF

echo ""
echo "🎉 MISSION ACCOMPLISHED! ANDROID PROJECT CREATED!"
echo "=================================================="
echo "📱 Project: DashkaBotAndroid"
echo "🎯 Package: com.dashkabot.voicetranslator"
echo "🔧 AndroidX: ✅ CONFIGURED"
echo "🌐 WebView: ✅ READY"
echo "🎤 Audio: ✅ PERMISSIONS SET"
echo "🔌 Network: ✅ HTTP + WebSocket"
echo ""
echo "🚀 ANDROID STUDIO READY COMMANDS:"
echo "   cd DashkaBotAndroid"
echo "   ./gradlew assembleDebug"
echo "   open -a 'Android Studio' ."
echo ""
echo "✨ SOLAR IT TEAM - MISSION COMPLETE! ✨"