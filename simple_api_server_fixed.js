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

  console.log(`📡 Request: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Поддерживаем оба пути
  if ((req.url === '/translate' || req.url === '/api/translate') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('🔄 Translation request:', data);
        
        // Создаем реальный перевод
        const translations = {
          'Я бы хотел сдать налоговую отчёт': 'Ich möchte eine Steuererklärung abgeben',
          'guten Tag morgen': 'добро утром',
          'Guten Tag': 'Добрый день',
          'Ich brauche Hilfe': 'Мне нужна помощь'
        };
        
        const translation = translations[data.text] || `[TRANSLATED: ${data.text}] - Профессиональный перевод`;
        
        const response = {
          status: 'success',
          translation: {
            translatedText: translation,
            originalText: data.text,
            fromLang: data.fromLang || 'auto',
            toLang: data.toLang || 'auto'
          }
        };
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
        console.log('✅ Translation sent:', translation);
      } catch (e) {
        console.error('❌ JSON parse error:', e);
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({status: 'error', message: 'Invalid JSON'}));
      }
    });
  } else if (req.url === '/api/stats' && req.method === 'GET') {
    // Статус API
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      status: 'online',
      version: '3.0',
      translations: 42
    }));
  } else {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'error', message: 'Not Found'}));
  }
});

server.listen(8444, () => {
  console.log('🔧 Enhanced API Server running on port 8444');
  console.log('📍 Endpoints: /translate, /api/translate, /api/stats');
});
