#!/bin/bash

# Setup Script для DashkaBot React + Vite + TypeScript + TailwindCSS Frontend
# Использование: chmod +x setup.sh && ./setup.sh

echo "🚀 Настройка DashkaBot React Frontend..."

# 1. Создание Vite проекта
echo "📦 Создание Vite + React + TypeScript проекта..."
cd /var/www/ai/DashkaVoicePolish/
npm create vite@latest frontend -- --template react-ts
cd frontend

# 2. Установка зависимостей
echo "⬇️ Установка зависимостей..."
npm install

# 3. Установка TailwindCSS
echo "🎨 Установка TailwindCSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Создание структуры папок
echo "📁 Создание структуры папок..."
mkdir -p src/components/Dashboard
mkdir -p src/components/UI
mkdir -p src/{hooks,services,types,config/languages}

# 5. Создание файлов компонентов
echo "📄 Создание файлов компонентов..."
touch src/AppShell.tsx
touch src/components/Dashboard/{Dashboard,Header,LanguageSelector,VoiceRecorder,TranslationPanel,StatusIndicators}.tsx
touch src/components/UI/{Button,Input,Card}.tsx
touch src/hooks/{useWebSocket,useTranslation,useSpeechRecognition}.ts
touch src/services/{api,websocket}.ts
touch src/types/index.ts
touch src/config/{currentLanguage,types}.ts
touch src/config/languages/{polish,german,english,index}.ts

# 6. Конфигурация TailwindCSS
echo "⚙️ Настройка TailwindCSS..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashka-blue': '#7c3aed',
        'dashka-green': '#10b981',
        'dashka-coral': '#f87171'
      }
    },
  },
  plugins: [],
}
EOF

# 7. Обновление index.css с исправлением белого текста
echo "🎨 Настройка стилей с исправлением белого текста..."
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Кастомные стили для glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ИСПРАВЛЕНИЕ: Темный текст на светлых полях ввода */
.input-field {
  @apply bg-white/90 text-gray-900 placeholder-gray-500;
  @apply border border-white/30 rounded-xl px-4 py-3;
  @apply focus:outline-none focus:ring-2 focus:ring-white/50;
}

/* Темный текст в textarea */
.textarea-field {
  @apply bg-white/90 text-gray-900 placeholder-gray-500;
  @apply border border-white/30 rounded-xl px-4 py-3;
  @apply focus:outline-none focus:ring-2 focus:ring-white/50;
  @apply resize-none;
}

/* Результат перевода - светлый фон с темным текстом */
.translation-result {
  @apply bg-white/95 text-gray-800 rounded-xl p-4 min-h-[80px];
  @apply border border-white/30;
}

/* Кнопки с улучшенным контрастом */
.btn-primary {
  @apply bg-green-500 hover:bg-green-600 text-white font-semibold;
  @apply px-6 py-3 rounded-xl transition-colors duration-200;
  @apply shadow-lg hover:shadow-xl;
}

.btn-secondary {
  @apply bg-white/20 hover:bg-white/30 text-white font-semibold;
  @apply px-6 py-3 rounded-xl transition-colors duration-200;
  @apply border border-white/30 backdrop-blur-sm;
}

/* Селекторы языков */
.language-btn {
  @apply px-4 py-3 rounded-xl font-semibold transition-all duration-200;
  @apply border-2 backdrop-blur-sm;
}

.language-btn.active {
  @apply bg-white/90 text-gray-900 border-white/50;
}

.language-btn.inactive {
  @apply bg-white/10 text-white border-white/30;
  @apply hover:bg-white/20;
}

/* Статус индикаторы */
.status-indicator {
  @apply flex items-center gap-2 text-sm font-medium;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-connected {
  @apply bg-green-400;
}

.status-disconnected {
  @apply bg-red-400;
}
EOF

# 8. Создание .env файла
echo "🔧 Создание .env файла..."
cat > .env << 'EOF'
VITE_API_URL=https://api.dashkapolish.swapoil.de
VITE_WS_URL=wss://api.dashkapolish.swapoil.de/ws
EOF

# 9. Обновление vite.config.ts
echo "⚙️ Настройка Vite конфигурации..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
EOF

# 10. Обновление package.json scripts
echo "📝 Обновление package.json scripts..."
npm pkg set scripts.type-check="tsc --noEmit"

# 11. Создание основного App.tsx
cat > src/App.tsx << 'EOF'
import AppShell from './AppShell';

function App() {
  return <AppShell />;
}

export default App;
EOF

# 12. Создание AppShell.tsx
cat > src/AppShell.tsx << 'EOF'
import Dashboard from './components/Dashboard/Dashboard';

function AppShell() {
  return <Dashboard />;
}

export default AppShell;
EOF

echo "✅ Установка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. cd frontend-react"
echo "2. npm run dev  # Запуск dev сервера на http://localhost:5173"
echo "3. npm run build  # Сборка для production"
echo ""
echo "🔧 Для смены языка интерфейса:"
echo "   Редактируйте файл: src/config/currentLanguage.ts"
echo ""
echo "🎨 Исправления стилей:"
echo "   - Поля ввода теперь с белым фоном и черным текстом"
echo "   - При копировании текст будет черным на белом фоне"
echo "   - Улучшенный контраст для всех элементов"