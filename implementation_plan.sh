
# 9. GIT КОММИТЫ (поэтапно)
echo "📤 Создание Git коммитов..."

# Коммит 1: Добавляем хук и зависимости
git add package.json package-lock.json src/hooks/
git commit -m "feat: Add useTranslator hook and react-responsive dependency

- Created shared hook for translation logic
- Added responsive design capabilities
- Extracted business logic from Dashboard components"

# Коммит 2: Добавляем Desktop Dashboard
git add src/components/Dashboard/DashboardDesktop.tsx
git commit -m "feat: Add DashboardDesktop with DeepL-style layout

- Two-column layout (input left, translation right)
- Auto-translate toggle like DeepL
- Layout toggle (vertical/horizontal)
- Optimized for MacBook/Desktop screens
- Full feature parity with original Dashboard"

# Коммит 3: Добавляем Tablet Dashboard
git add src/components/Dashboard/DashboardTablet.tsx
git commit -m "feat: Add DashboardTablet for iPad optimization

- Vertical layout (input top, translation bottom)
- Compact controls for tablet interface
- Touch-friendly buttons and interactions
- Maintains all voice and text features"

# Коммит 4: Добавляем Mobile Dashboard
git add src/components/Dashboard/DashboardMobile.tsx
git commit -m "feat: Add DashboardMobile for iPhone optimization

- Single column layout
- Compact design for small screens
- Touch-optimized controls
- Streamlined interface"

# Коммит 5: Обновляем AppShell с responsive logic
git add src/AppShell.tsx .env.development .env.production
git commit -m "feat: Implement responsive dashboard switching

- AppShell now detects device type
- Automatic dashboard selection based on screen size
- Environment-specific configuration
- Ready for multi-device deployment"

# Коммит 6: Бэкап и документация
git add src/components/Dashboard/Dashboard.backup.tsx
git commit -m "docs: Backup original Dashboard and update architecture

- Preserved original Dashboard.tsx as backup
- Updated build scripts for production
- Added environment configurations
- Architecture now supports three device types"
