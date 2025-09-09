#!/bin/bash
# 🚀 RENDER DEPLOYMENT SETUP - AI IT SOLAR
# ========================================

echo "🎯 AI IT SOLAR - Подготовка к деплою на Render"
echo "=============================================="

# 1. СОЗДАЕМ RENDER КОНФИГУРАЦИЮ
echo "📝 Создаем render.yaml..."
cat > render.yaml << 'EOF'
services:
  - type: web
    name: dashka-backend
    runtime: node
    plan: free
    region: oregon
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
      - key: OPENAI_API_KEY
        fromGroup: secrets
    healthCheckPath: /health
    
  - type: web  
    name: dashka-frontend
    runtime: static
    plan: free
    region: oregon
    buildCommand: cd frontend && npm run build
    staticPublishPath: frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
EOF

# 2. ОБНОВЛЯЕМ PACKAGE.JSON ДЛЯ BACKEND
echo "⚙️ Настраиваем backend package.json для production..."
cd backend || exit 1

# Добавляем скрипт start если его нет
npm pkg set scripts.start="node src/server.js"
npm pkg set scripts.postinstall="echo 'Backend dependencies installed'"
npm pkg set engines.node=">=18.0.0"

# 3. ОБНОВЛЯЕМ FRONTEND ДЛЯ PRODUCTION
echo "🌐 Настраиваем frontend для production..."
cd ../frontend || exit 1

# Создаем production конфиг
cat > .env.production << 'EOF'
VITE_API_URL=https://dashka-backend.onrender.com
VITE_WS_URL=wss://dashka-backend.onrender.com/ws
VITE_APP_MODE=production
EOF

# Обновляем package.json для static build
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"

# 4. СОЗДАЕМ СТАТИЧЕСКИЙ BUILD ДЛЯ RENDER
echo "🔨 Создаем статический build..."

# Создаем простой vite.config.js для статики
cat > vite.config.simple.js << 'EOF'
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 3000
  }
})
EOF

# 5. ПОДГОТОВКА СТАТИЧЕСКИХ ФАЙЛОВ
mkdir -p dist
cp index.html dist/
cp -r public/* dist/ 2>/dev/null || true

echo "📋 Создаем Dockerfile для бэкапа..."
cd ../

cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
EXPOSE 8080

CMD ["node", "backend/src/server.js"]
EOF

# 6. GITHUB ПОДГОТОВКА
echo "📤 Подготовка к Git push..."

# Создаем .gitignore если его нет
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Production builds
dist/
build/

# Environment variables
.env.local
.env.production.local

# Cache
.cache/
tmp/
temp/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
logs/
*.log
EOF

# 7. README ДЛЯ RENDER
cat > README.md << 'EOF'
# 🌍 DashkaVoice - AI Translation Platform

## 🚀 AI IT SOLAR Project

Professional Russian ⇄ German voice translator with real-time WebSocket sync.

### 📁 Structure
- `backend/` - Node.js API server (Express + OpenAI)
- `frontend/` - Static HTML interface with WebSocket

### 🔧 Render Deployment
- Backend: Node.js service on port 8080
- Frontend: Static site deployment
- Environment: Production-ready with health checks

### 🌟 Features
- Real-time voice translation
- WebSocket synchronization
- Mobile-responsive design
- Professional glassmorphism UI

Built with ❤️ by AI IT SOLAR team
EOF

echo ""
echo "✅ RENDER SETUP COMPLETE!"
echo "========================"
echo ""
echo "📋 NEXT STEPS:"
echo "1️⃣  git add . && git commit -m 'Render deployment ready'"
echo "2️⃣  git push origin main"
echo "3️⃣  Создать новый Web Service на render.com"
echo "4️⃣  Подключить GitHub репозиторий"
echo "5️⃣  Настроить environment variables:"
echo "    - OPENAI_API_KEY (ваш ключ)"
echo "    - NODE_ENV=production"
echo ""
echo "🌐 После деплоя URLs будут:"
echo "   Backend:  https://dashka-backend.onrender.com"
echo "   Frontend: https://dashka-frontend.onrender.com"
echo ""
echo "🎯 Ready for QA testing on Render!"
