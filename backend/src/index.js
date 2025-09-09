/**
 * DashkaBot API Server - Main Entry Point
 * AI IT SOLAR Team - Professional Backend
 */

const path = require('path');

console.log('🚀 DashkaBot Backend Server starting...');
console.log('📁 Working directory:', __dirname);

// Проверяем какой сервер запускать
const serverMode = process.env.SERVER_MODE || 'main';

let serverModule;

try {
    switch(serverMode) {
        case 'api':
            console.log('🔌 Loading AI Server...');
            serverModule = require('./ai_server_node.js');
            break;
        case 'ws':
            console.log('🔗 Loading WebSocket Server...');
            serverModule = require('./simple_websocket_server.js');
            break;
        case 'mobile':
            console.log('📱 Loading Mobile Server...');
            serverModule = require('./mobile_web_server.js');
            break;
        default:
            console.log('🏗️ Loading Main Server...');
            // Пробуем загрузить основной сервер
            try {
                serverModule = require('./server.js');
            } catch (err) {
                console.log('⚡ Fallback to AI Server...');
                serverModule = require('./ai_server_node.js');
            }
    }
    
    console.log('✅ Server module loaded successfully');
    
} catch (error) {
    console.error('❌ Error loading server:', error.message);
    console.log('🔍 Available files in src:');
    const fs = require('fs');
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
    files.forEach(file => console.log(`   - ${file}`));
    process.exit(1);
}
