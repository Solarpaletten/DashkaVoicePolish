// Исправленная конфигурация для HTML файла
// Замените эти строки в index.html:

// СТАРАЯ КОНФИГУРАЦИЯ (строки ~321-326):
/*
const config = {
    aiServer: window.location.origin,
    wsServer: `ws://${window.location.hostname}:8765`,
    enableWebSocket: true,
    enableSpeech: true
};
*/

// НОВАЯ ИСПРАВЛЕННАЯ КОНФИГУРАЦИЯ:
const config = {
    aiServer: 'http://localhost:8080',
    wsServer: 'ws://localhost:8080/ws',
    enableWebSocket: true,
    enableSpeech: true
};

// ТАКЖЕ ИСПРАВИТЬ функцию checkAIServer (строка ~477):
// СТАРОЕ:
// const response = await fetch(`${config.aiServer}/api/health`);

// НОВОЕ:
const response = await fetch(`${config.aiServer}/health`);