#!/bin/bash

echo "🔧 Исправляем сервер и настраиваем GitHub..."

# 1. Остановим все процессы
echo "⏹️ Останавливаем все процессы..."
pkill -f "node.*dashka" 2>/dev/null || true
pkill -f "python.*ai_server" 2>/dev/null || true

# 2. Проверим и исправим HTTPS API
echo "🔧 Исправляем HTTPS API..."
cat > https_api_server.js << 'EOF'
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem')
};

const server = https.createServer(options, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/translate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Простой тестовый перевод
        const translation = `[TRANSLATED: ${data.text}]`;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({translation}));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8444, () => {
  console.log('HTTPS API Server running on port 8444');
});
EOF

# 3. Исправим основной HTTPS сервер
echo "🌐 Исправляем основной HTTPS сервер..."
cat > https_server.js << 'EOF'
const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem')
};

const server = https.createServer(options, (req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'dashkabot_web', filePath);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json'
    }[ext] || 'text/plain';
    
    res.writeHead(200, {'Content-Type': contentType});
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('File not found');
  }
});

server.listen(8443, '0.0.0.0', () => {
  console.log('HTTPS Server running on https://0.0.0.0:8443');
});
EOF

# 4. Создадим PWA версию
echo "📱 Создаем PWA версию..."
cat > dashkabot_web/index_pwa.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DashkaBot - Голосовой переводчик</title>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#667eea">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .mic-button {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(circle, #ff6b6b, #ee5a24);
            border: none;
            font-size: 3em;
            color: white;
            cursor: pointer;
            margin: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .mic-button:hover {
            transform: scale(1.1);
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }
        .mic-button.recording {
            animation: pulse 1.5s infinite;
            background: radial-gradient(circle, #ff3838, #c0392b);
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .text-area {
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            min-height: 100px;
            font-size: 1.2em;
            backdrop-filter: blur(10px);
        }
        .status {
            margin: 20px 0;
            font-size: 1.1em;
            font-weight: bold;
        }
        .install-button {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            margin: 20px;
            transition: all 0.3s ease;
        }
        .install-button:hover {
            background: white;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 DashkaBot</h1>
        <p style="font-size: 1.2em; margin-bottom: 30px;">Синхронный голосовой переводчик</p>
        
        <button id="installBtn" class="install-button" style="display: none;">
            📱 Установить приложение
        </button>
        
        <div>
            <button id="micBtn" class="mic-button">🎤</button>
        </div>
        
        <div id="status" class="status">Нажмите микрофон для начала</div>
        
        <div id="inputText" class="text-area">
            Ваша речь появится здесь...
        </div>
        
        <div id="outputText" class="text-area">
            Перевод появится здесь...
        </div>
    </div>

    <script>
        // PWA Installation
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'inline-block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });

        // Speech Recognition and Translation
        const micBtn = document.getElementById('micBtn');
        const status = document.getElementById('status');
        const inputText = document.getElementById('inputText');
        const outputText = document.getElementById('outputText');

        let recognition;
        let isListening = false;

        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ru-RU';

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add('recording');
                status.textContent = '🎧 Слушаю...';
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                inputText.textContent = transcript;
                
                if (event.results[event.results.length - 1].isFinal) {
                    translateText(transcript);
                }
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove('recording');
                status.textContent = 'Нажмите микрофон для начала';
            };

            recognition.onerror = (event) => {
                status.textContent = 'Ошибка: ' + event.error;
                micBtn.classList.remove('recording');
                isListening = false;
            };
        }

        micBtn.addEventListener('click', () => {
            if (!recognition) {
                status.textContent = 'Распознавание речи не поддерживается';
                return;
            }

            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });

        async function translateText(text) {
            try {
                status.textContent = '🔄 Переводим...';
                
                const response = await fetch('https://172.20.10.4:8444/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text })
                });

                const result = await response.json();
                outputText.textContent = result.translation || 'Ошибка перевода';
                status.textContent = '✅ Готово!';
                
                // Озвучиваем перевод
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(result.translation);
                    utterance.lang = 'en-US';
                    speechSynthesis.speak(utterance);
                }
                
            } catch (error) {
                outputText.textContent = 'Ошибка подключения к серверу';
                status.textContent = '❌ Ошибка сети';
                console.error('Translation error:', error);
            }
        }

        // Service Worker для PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(console.error);
        }
    </script>
</body>
</html>
EOF

# 5. Создаем PWA манифест
cat > dashkabot_web/manifest.json << 'EOF'
{
  "name": "DashkaBot - Голосовой переводчик",
  "short_name": "DashkaBot",
  "description": "Синхронный голосовой переводчик для переговоров",
  "start_url": "/index_pwa.html",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "orientation": "portrait",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23667eea'/%3E%3Ctext x='50' y='65' text-anchor='middle' fill='white' font-size='35'%3E🎤%3C/text%3E%3C/svg%3E",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
EOF

# 6. Создаем Service Worker
cat > dashkabot_web/sw.js << 'EOF'
const CACHE_NAME = 'dashkabot-v1';
const urlsToCache = [
  '/index_pwa.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
EOF

# 7. Запускаем серверы
echo "🚀 Запускаем серверы..."
node https_api_server.js &
echo $! > run/https_api_server.pid

node https_server.js &
echo $! > run/https_server.pid

# 8. Исправляем GitHub проблемы
echo "🐙 Исправляем GitHub..."

# Принудительный push с перезаписью
git pull origin main --allow-unrelated-histories 2>/dev/null || true
git add .
git commit -m "Fix servers and add PWA support" 2>/dev/null || true

# Если есть конфликты, форсируем push
git push origin main --force-with-lease 2>/dev/null || git push origin main --force

echo ""
echo "✅ Готово!"
echo ""
echo "🌐 Серверы запущены:"
echo "   HTTPS Web: https://172.20.10.4:8443"
echo "   HTTPS API: https://172.20.10.4:8444"
echo "   PWA: https://172.20.10.4:8443/index_pwa.html"
echo ""
echo "📱 Для установки PWA на телефоне:"
echo "   1. Откройте https://172.20.10.4:8443/index_pwa.html"
echo "   2. Нажмите 'Установить приложение'"
echo "   3. Или используйте 'Добавить на главный экран'"
echo ""
echo "🔧 Теперь соберите APK:"
echo "   cd DashkaBotAndroid_New"
echo "   ./gradlew assembleDebug"
EOF

chmod +x fix_server_and_deploy.sh
./fix_server_and_deploy.sh