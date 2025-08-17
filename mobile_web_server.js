const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 8090;

app.use(express.static('dashkabot_web'));
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Проксирование к AI серверу
app.use('/api', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: req.originalUrl.replace('/api', ''),
        method: req.method,
        headers: { 'Content-Type': 'application/json' }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        res.status(500).json({ error: 'AI сервер недоступен' });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashkabot_web', 'index.html'));
});

app.listen(PORT, "172.20.10.4", () => {
    console.log(`🌐 Web сервер запущен на http://172.20.10.4:${PORT}`);
});
