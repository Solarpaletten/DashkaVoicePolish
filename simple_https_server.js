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
