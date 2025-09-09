#!/usr/bin/env bash
set -euo pipefail

echo "⚛️ AI IT SOLAR - Создание Frontend package.json"
echo "=============================================="

# Создаем package.json для React + Vite + TypeScript + Tailwind
cat > package.json << 'EOF'
{
  "name": "dashka-frontend",
  "version": "3.0.0",
  "description": "DashkaBot Voice Polish Translator - React Frontend by AI IT SOLAR Team",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  },
  "keywords": ["react", "vite", "typescript", "tailwind", "voice", "translator"],
  "author": "AI IT SOLAR Team",
  "license": "MIT"
}
EOF

echo "✅ package.json создан"

# Обновляем vite.config.ts если нужно
if [ ! -f "vite.config.ts" ]; then
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
EOF
echo "✅ vite.config.ts создан"
fi

# Создаем .env для frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=DashkaBot Voice Translator
VITE_VERSION=3.0.0
EOF

echo "✅ .env создан"

# Проверяем что все компоненты на месте
echo ""
echo "🔍 Проверяем структуру компонентов..."
required_components=(
  "src/App.tsx"
  "src/AppShell.tsx" 
  "src/main.tsx"
  "src/index.css"
)

for component in "${required_components[@]}"; do
  if [ -f "$component" ]; then
    echo "   ✅ $component найден"
  else
    echo "   ❌ $component отсутствует"
  fi
done

echo ""
echo "✅ Frontend настройка завершена!"
echo "🎯 Теперь запускаем:"
echo "   npm install"
echo "   npm run dev"