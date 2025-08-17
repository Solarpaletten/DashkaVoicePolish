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
import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "DashkaBot";
    private static final int REQUEST_PERMISSIONS = 100;
    private ActivityMainBinding binding;
    private WebView webView;
    private TextToSpeech textToSpeech;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        Log.i(TAG, "🚀 DashkaBot запускается...");
        setupWebView();
        checkPermissions();
        initializeTTS();
    }
    
    private void initializeTTS() {
        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                Log.i(TAG, "✅ TTS инициализирован");
            } else {
                Log.e(TAG, "❌ TTS не инициализирован");
            }
        });
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
        webView.loadUrl("http://172.20.10.4:8090");
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

    @Override
    protected void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
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

        @JavascriptInterface
        public void speakText(String text, String language) {
            Log.i(TAG, "🔊 TTS запрос: " + text + " (" + language + ")");
            
            if (textToSpeech == null) {
                Log.e(TAG, "❌ TTS не инициализирован");
                return;
            }
            
            runOnUiThread(() -> {
                Locale locale = getLocaleForLanguage(language);
                int result = textToSpeech.setLanguage(locale);
                
                if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                    textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "dashkabot_tts");
                    Log.i(TAG, "✅ TTS проигрывается на " + language);
                } else {
                    Log.e(TAG, "❌ Язык не поддерживается: " + language);
                    Toast.makeText(MainActivity.this, "Язык " + language + " не поддерживается", Toast.LENGTH_SHORT).show();
                }
            });
        }
        
        private Locale getLocaleForLanguage(String language) {
            switch (language) {
                case "de": return Locale.GERMAN;
                case "en": return Locale.ENGLISH;
                case "es": return new Locale("es");
                case "pl": return new Locale("pl");
                case "cs": return new Locale("cs");
                case "lt": return new Locale("lt");
                case "lv": return new Locale("lv");
                case "no": return new Locale("no");
                default: return new Locale("ru");
            }
        }
    }
}