const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const MOBILE_IP = '0.0.0.0';

app.use(express.static('dashkabot_web'));
app.use(express.json());

// CORS для мобильного
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

app.listen(PORT, MOBILE_IP, () => {
    console.log(`📱 Mobile Web сервер на http://${MOBILE_IP}:${PORT}`);
});
