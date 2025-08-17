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
