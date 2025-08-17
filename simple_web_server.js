const express = require('express');
const path = require('path');

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashkabot_web', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Web сервер запущен на http://localhost:${PORT}`);
});
