const WebSocket = require('ws');
const http = require('http');

class DashkaBotWebSocketServer {
    constructor(port = 8765) {
        this.port = port;
        this.clients = new Map();
        this.translations = [];
        this.setupServer();
    }

    setupServer() {
        this.wss = new WebSocket.Server({ port: this.port });
        
        this.wss.on('connection', (ws, request) => {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.clients.set(clientId, {
                ws: ws,
                role: 'unknown',
                connected_at: new Date()
            });

            console.log(`🔗 Новое подключение: ${clientId}`);

            // Приветственное сообщение
            ws.send(JSON.stringify({
                type: 'welcome',
                client_id: clientId,
                message: 'Добро пожаловать в DashkaBot!',
                timestamp: new Date().toISOString()
            }));

            ws.on('message', (message) => {
                this.handleMessage(clientId, message);
            });

            ws.on('close', () => {
                console.log(`❌ Отключение: ${clientId}`);
                this.clients.delete(clientId);
            });

            ws.on('error', (error) => {
                console.error(`❌ Ошибка WebSocket для ${clientId}:`, error);
            });
        });

        console.log(`🌐 WebSocket сервер запущен на порту ${this.port}`);
    }

    handleMessage(senderId, message) {
        try {
            const data = JSON.parse(message);
            data.sender_id = senderId;
            data.timestamp = new Date().toISOString();

            console.log(`📨 Сообщение от ${senderId}:`, data.type);

            // Обработка разных типов сообщений
            switch (data.type) {
                case 'set_role':
                    this.setClientRole(senderId, data.role);
                    break;
                case 'audio_data':
                    this.handleAudioData(senderId, data);
                    break;
                case 'translation_request':
                    this.handleTranslationRequest(senderId, data);
                    break;
                default:
                    this.broadcastToOthers(senderId, data);
            }

        } catch (error) {
            console.error(`❌ Ошибка обработки сообщения от ${senderId}:`, error);
        }
    }

    setClientRole(clientId, role) {
        if (this.clients.has(clientId)) {
            this.clients.get(clientId).role = role;
            console.log(`👤 Клиент ${clientId} установил роль: ${role}`);
            
            // Подтверждение установки роли
            this.clients.get(clientId).ws.send(JSON.stringify({
                type: 'role_confirmed',
                role: role,
                timestamp: new Date().toISOString()
            }));
        }
    }

    handleAudioData(senderId, data) {
        // Пересылаем аудиоданные другим клиентам
        this.broadcastToOthers(senderId, {
            type: 'audio_received',
            audio_data: data.audio_data,
            source_role: this.clients.get(senderId)?.role || 'unknown',
            timestamp: data.timestamp
        });
    }

    handleTranslationRequest(senderId, data) {
        // Логируем запрос на перевод
        console.log(`🔄 Запрос перевода от ${senderId}: "${data.text}"`);
        
        // Сохраняем в историю
        this.translations.push({
            sender_id: senderId,
            original_text: data.text,
            source_language: data.source_language,
            target_language: data.target_language,
            timestamp: data.timestamp
        });

        // Пересылаем запрос другим клиентам
        this.broadcastToOthers(senderId, data);
    }

    broadcastToOthers(senderId, data) {
        this.clients.forEach((client, clientId) => {
            if (clientId !== senderId && client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(JSON.stringify(data));
                } catch (error) {
                    console.error(`❌ Ошибка отправки сообщения ${clientId}:`, error);
                }
            }
        });
    }

    getStats() {
        return {
            connected_clients: this.clients.size,
            total_translations: this.translations.length,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage()
        };
    }
}

// HTTP сервер для статистики
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/stats') {
        res.writeHead(200);
        res.end(JSON.stringify(wsServer.getStats(), null, 2));
    } else if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ 
            status: 'healthy', 
            service: 'DashkaBot WebSocket',
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Запуск серверов
const wsServer = new DashkaBotWebSocketServer(8765);
server.listen(8766, () => {
    console.log('📊 HTTP сервер статистики запущен на порту 8766');
    console.log('🔗 Доступные endpoints:');
    console.log('   http://localhost:8766/health');
    console.log('   http://localhost:8766/stats');
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал завершения...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал терминации...');
    process.exit(0);
});
