const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());

// CORS для всех запросов
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

// Проксирование API запросов к AI серверу
app.use('/api', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: req.originalUrl,
        method: req.method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('API Proxy error:', err);
        res.status(500).json({ error: 'AI сервер недоступен' });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
});

// Статические файлы
app.use(express.static('dashkabot_web'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashkabot_web', 'index.html'));
});

// HTTPS сервер
const options = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

https.createServer(options, app).listen(8443, '0.0.0.0', () => {
    console.log('🔒 DashkaBot HTTPS сервер запущен на https://172.20.10.4:8443');
    console.log('🎤 Микрофон будет работать через HTTPS');
});
