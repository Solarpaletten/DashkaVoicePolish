const WebSocket = require('ws');
const http = require('http');

class SimpleWebSocketServer {
    constructor(port = 8765) {
        this.port = port;
        this.clients = new Map();
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

            console.log(`🔗 Новое подключение: ${clientId} (всего: ${this.clients.size})`);

            // Приветственное сообщение
            ws.send(JSON.stringify({
                type: 'welcome',
                client_id: clientId,
                message: 'Подключение к DashkaBot успешно!',
                timestamp: new Date().toISOString()
            }));

            ws.on('message', (message) => {
                this.handleMessage(clientId, message);
            });

            ws.on('close', () => {
                console.log(`❌ Отключение: ${clientId} (осталось: ${this.clients.size - 1})`);
                this.clients.delete(clientId);
            });

            ws.on('error', (error) => {
                console.error(`❌ Ошибка WebSocket для ${clientId}:`, error.message);
            });
        });

        console.log(`🔌 WebSocket сервер запущен на порту ${this.port}`);
        console.log(`   Подключение: ws://localhost:${this.port}`);
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
                case 'translation':
                    this.broadcastTranslation(senderId, data);
                    break;
                case 'audio_data':
                    this.broadcastAudio(senderId, data);
                    break;
                case 'ping':
                    // Отвечаем на ping
                    this.clients.get(senderId).ws.send(JSON.stringify({
                        type: 'pong',
                        timestamp: new Date().toISOString()
                    }));
                    break;
                default:
                    this.broadcastToOthers(senderId, data);
            }

        } catch (error) {
            console.error(`❌ Ошибка обработки сообщения от ${senderId}:`, error.message);
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

            // Уведомляем других клиентов
            this.broadcastToOthers(clientId, {
                type: 'user_role_changed',
                user_id: clientId,
                role: role,
                timestamp: new Date().toISOString()
            });
        }
    }

    broadcastTranslation(senderId, data) {
        console.log(`🌍 Трансляция перевода от ${senderId}`);
        
        // Добавляем информацию об отправителе
        const message = {
            ...data,
            sender_role: this.clients.get(senderId)?.role || 'unknown',
            sender_id: senderId
        };

        this.broadcastToOthers(senderId, message);
    }

    broadcastAudio(senderId, data) {
        console.log(`🎤 Трансляция аудио от ${senderId}`);
        
        const message = {
            ...data,
            sender_role: this.clients.get(senderId)?.role || 'unknown',
            sender_id: senderId
        };

        this.broadcastToOthers(senderId, message);
    }

    broadcastToOthers(senderId, data) {
        let sentCount = 0;
        
        this.clients.forEach((client, clientId) => {
            if (clientId !== senderId && client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(JSON.stringify(data));
                    sentCount++;
                } catch (error) {
                    console.error(`❌ Ошибка отправки сообщения ${clientId}:`, error.message);
                }
            }
        });

        if (sentCount > 0) {
            console.log(`📡 Сообщение отправлено ${sentCount} клиентам`);
        }
    }

    getStats() {
        const roles = {};
        this.clients.forEach(client => {
            roles[client.role] = (roles[client.role] || 0) + 1;
        });

        return {
            connected_clients: this.clients.size,
            client_roles: roles,
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
            connected_clients: wsServer.clients.size,
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Запуск серверов
const wsServer = new SimpleWebSocketServer(8765);
server.listen(8766, () => {
    console.log('📊 HTTP статистика на http://localhost:8766/health');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка WebSocket сервера...');
    wsServer.wss.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал терминации...');
    process.exit(0);
});