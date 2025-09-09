window.DashkaBotConfig = {
    apiBase: 'http://172.20.10.4:8080',  // Изменить с localhost на 172.20.10.4
    endpoints: {
        translate: '/translate',
        test: '/test', 
        stats: '/stats',
        languages: '/languages'
    },
    websocket: {
        url: 'ws://172.20.10.4:8765',  // Изменить WebSocket URL
        enabled: true
    }
};