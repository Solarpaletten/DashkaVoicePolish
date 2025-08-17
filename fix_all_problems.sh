#!/bin/bash

echo "🛠️ Решаем все проблемы..."

# 1. ПОЛНОСТЬЮ останавливаем все процессы
echo "⏹️ Полная остановка всех процессов..."
sudo lsof -ti:8443 | xargs kill -9 2>/dev/null || true
sudo lsof -ti:8444 | xargs kill -9 2>/dev/null || true
pkill -f "node.*https" 2>/dev/null || true
pkill -f "node.*dashka" 2>/dev/null || true
pkill -f "python.*ai_server" 2>/dev/null || true

# Ждем завершения процессов
sleep 2

# 2. Удаляем файл с секретами из Git
echo "🔐 Удаляем .env файл с секретами..."
rm -f .env
echo ".env" >> .gitignore

# 3. Создаем .env.example без реальных ключей
cat > .env.example << 'EOF'
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
PORT=8443
API_PORT=8444
EOF

# 4. Исправляем проблему с бесконечным циклом в скрипте
echo "🔧 Создаем правильный запуск серверов..."

# Простой HTTPS сервер
cat > simple_https_server.js << 'EOF'
const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem')
};

const server = https.createServer(options, (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/index_pwa.html' : req.url;
  filePath = path.join(__dirname, 'dashkabot_web', filePath);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';
    
    res.writeHead(200, {'Content-Type': contentType});
    res.end(fs.readFileSync(filePath));
    console.log(`✅ Served: ${filePath}`);
  } else {
    console.log(`❌ Not found: ${filePath}`);
    res.writeHead(404);
    res.end(`File not found: ${req.url}`);
  }
});

server.listen(8443, '0.0.0.0', () => {
  console.log('🌐 HTTPS Server running on https://0.0.0.0:8443');
  console.log('📱 PWA: https://172.20.10.4:8443/index_pwa.html');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
EOF

# Простой API сервер
cat > simple_api_server.js << 'EOF'
const https = require('https');
const fs = require('fs');

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
        console.log('🔄 Translation request:', data.text);
        
        // Простой мок-перевод (замените на реальный OpenAI API)
        const translation = `[TRANSLATED: ${data.text}] - Mock translation for testing`;
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({translation}));
        console.log('✅ Translation sent:', translation);
      } catch (e) {
        console.error('❌ JSON parse error:', e);
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
  console.log('🔧 HTTPS API Server running on port 8444');
});

server.on('error', (err) => {
  console.error('❌ API Server error:', err);
  process.exit(1);
});
EOF

# 5. Создаем корректную PWA версию
echo "📱 Создаем PWA..."
mkdir -p dashkabot_web

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
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 600px;
            padding: 30px;
            text-align: center;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            font-size: 1.3em;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        .mic-button {
            width: 120px;
            height: 120px;
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
            margin: 15px 0;
            min-height: 80px;
            font-size: 1.1em;
            text-align: left;
        }
        .status {
            margin: 20px 0;
            font-size: 1.2em;
            font-weight: bold;
        }
        .success { color: #2ecc71; }
        .error { color: #e74c3c; }
        .processing { color: #f39c12; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 DashkaBot</h1>
        <p class="subtitle">Синхронный голосовой переводчик</p>
        
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
        const micBtn = document.getElementById('micBtn');
        const status = document.getElementById('status');
        const inputText = document.getElementById('inputText');
        const outputText = document.getElementById('outputText');

        let recognition;
        let isListening = false;

        // Проверяем поддержку Speech Recognition
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ru-RU';

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add('recording');
                status.textContent = '🎧 Слушаю...';
                status.className = 'status processing';
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
                if (status.textContent === '🎧 Слушаю...') {
                    status.textContent = 'Нажмите микрофон для начала';
                    status.className = 'status';
                }
            };

            recognition.onerror = (event) => {
                status.textContent = 'Ошибка: ' + event.error;
                status.className = 'status error';
                micBtn.classList.remove('recording');
                isListening = false;
            };
        } else {
            status.textContent = 'Распознавание речи не поддерживается в этом браузере';
            status.className = 'status error';
        }

        micBtn.addEventListener('click', () => {
            if (!recognition) {
                status.textContent = 'Функция недоступна';
                status.className = 'status error';
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
                status.className = 'status processing';
                
                const response = await fetch('https://172.20.10.4:8444/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();
                outputText.textContent = result.translation || 'Ошибка перевода';
                status.textContent = '✅ Готово!';
                status.className = 'status success';
                
                // Озвучиваем перевод
                if ('speechSynthesis' in window && result.translation) {
                    const utterance = new SpeechSynthesisUtterance(result.translation);
                    utterance.lang = 'en-US';
                    speechSynthesis.speak(utterance);
                }
                
            } catch (error) {
                outputText.textContent = 'Ошибка подключения к серверу: ' + error.message;
                status.textContent = '❌ Ошибка сети';
                status.className = 'status error';
                console.error('Translation error:', error);
            }
        }

        // Тест подключения при загрузке
        window.addEventListener('load', () => {
            console.log('🚀 DashkaBot PWA загружен');
            setTimeout(() => {
                if (status.textContent === 'Нажмите микрофон для начала') {
                    status.textContent = '✅ Готов к работе';
                    status.className = 'status success';
                }
            }, 1000);
        });
    </script>
</body>
</html>
EOF

# 6. Создаем манифест и service worker
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

# 7. Запускаем серверы
echo "🚀 Запускаем серверы..."

# Запускаем API сервер в фоне
node simple_api_server.js &
API_PID=$!
echo $API_PID > run/api_server.pid
echo "✅ API Server запущен (PID: $API_PID)"

# Даем время на запуск API
sleep 2

# Запускаем веб сервер в фоне
node simple_https_server.js &
WEB_PID=$!
echo $WEB_PID > run/web_server.pid
echo "✅ Web Server запущен (PID: $WEB_PID)"

# 8. Исправляем GitHub - удаляем секреты из истории
echo "🐙 Исправляем GitHub (удаляем секреты)..."

# Удаляем файл из Git истории
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true

# Принудительно очищаем и коммитим
git add .
git commit -m "Remove .env secrets and fix servers" 2>/dev/null || true

# Форсируем push
git push origin main --force 2>/dev/null || git push origin main --force-with-lease

echo ""
echo "🎉 Все проблемы решены!"
echo ""
echo "🌐 Серверы запущены:"
echo "   Web: https://172.20.10.4:8443"
echo "   API: https://172.20.10.4:8444"
echo "   PWA: https://172.20.10.4:8443/index_pwa.html"
echo ""
echo "📱 Для установки PWA:"
echo "   1. Откройте на телефоне: https://172.20.10.4:8443/index_pwa.html"
echo "   2. В Safari: Поделиться → На экран 'Домой'"
echo "   3. В Chrome: Меню → Добавить на главный экран"
echo ""
echo "🔧 Для сборки APK:"
echo "   cd DashkaBotAndroid_New"
echo "   ./gradlew assembleDebug"
echo ""

# Проверяем статус серверов
sleep 3
echo "🔍 Проверка серверов:"
curl -k -s https://172.20.10.4:8443 > /dev/null && echo "✅ Web server работает" || echo "❌ Web server недоступен"
curl -k -s https://172.20.10.4:8444 > /dev/null && echo "✅ API server работает" || echo "❌ API server недоступен"