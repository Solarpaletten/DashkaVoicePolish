// DashkaBot Configuration
window.DashkaBotConfig = {
    apiBase: window.location.origin,
    endpoints: {
        translate: '/api/translate',
        test: '/api/test', 
        stats: '/api/stats',
        languages: '/api/languages'
    },
    websocket: {
        url: 'ws://localhost:8765',
        enabled: true
    }
};
