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
