# 1. Исправляем AI Server
sed -i '' 's/this\.app\.listen(this\.port, () => {/this.app.listen(this.port, "172.20.10.4", () => {/' ai_server_node.js

# 2. Исправляем WebSocket Server  
sed -i '' 's/{ port: this\.port }/{ port: this.port, host: "172.20.10.4" }/' simple_websocket_server.js

# 3. Проверяем что получилось
echo "🔍 Проверка AI Server:"
grep -n "listen.*172.20.10.4" ai_server_node.js

echo "🔍 Проверка WebSocket:"
grep -n "host.*172.20.10.4" simple_websocket_server.js

echo "🔍 Mobile Web уже готов:"
grep -n "172.20.10.4" mobile_web_server.js
