// ========================================
// TABLET DASHBOARD - iPad оптимизация
// ========================================
// src/components/Dashboard/DashboardTablet.tsx
import React from 'react';
import { useTranslator } from '../../hooks/useTranslator';
import { currentLanguageConfig } from '../../config/currentLanguage';

const DashboardTablet: React.FC = () => {
  const {
    currentRole,
    currentMode,
    inputText,
    originalText,
    translatedText,
    isRecording,
    status,
    isTranslating,
    connectionStatus,
    setCurrentMode,
    setInputText,
    handleRoleChange,
    toggleRecording,
    translateText,
    clearText,
    pasteText,
    copyResult
  } = useTranslator();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 p-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-white text-2xl font-bold mb-2">
            {currentLanguageConfig.app.title}
          </h1>
          <p className="text-white/80 text-sm mb-4">
            📲 iPad Mode | {currentLanguageConfig.app.subtitle}
          </p>
          
          {/* Language Selector */}
          <div className="flex gap-3 justify-center">
            <button
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                currentRole === 'user' 
                  ? 'bg-white/90 text-gray-900' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => handleRoleChange('user')}
            >
              🇷🇺 {currentLanguageConfig.languageSelector.sourceLabel}
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                currentRole === 'steuerberater' 
                  ? 'bg-white/90 text-gray-900' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => handleRoleChange('steuerberater')}
            >
              🇵🇱 {currentLanguageConfig.languageSelector.targetLabel}
            </button>
          </div>
        </header>

        {/* Mode Tabs */}
        <div className="flex mb-6 bg-black/20 rounded-xl p-1 w-fit mx-auto">
          <button
            className={`py-2 px-6 rounded-lg text-sm font-medium transition-all ${
              currentMode === 'text'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white'
            }`}
            onClick={() => setCurrentMode('text')}
          >
            📝 Текст
          </button>
          <button
            className={`py-2 px-6 rounded-lg text-sm font-medium transition-all ${
              currentMode === 'voice'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white'
            }`}
            onClick={() => setCurrentMode('voice')}
          >
            🎤 Голос
          </button>
        </div>

        {/* Status */}
        <div className="bg-white/20 p-3 rounded-xl mb-6 text-center text-white font-medium">
          {status}
        </div>

        {/* Input Section */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm">
          <h2 className="text-white font-semibold mb-4">
            {currentMode === 'text' ? 'Исходный текст' : 'Голосовой ввод'}
          </h2>

          {/* Text Mode */}
          {currentMode === 'text' && (
            <div className="relative mb-4">
              <textarea
                className="w-full h-32 rounded-xl p-4 resize-none text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder={currentLanguageConfig.placeholders.inputText}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              
              {/* Quick Actions */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  className="w-8 h-8 bg-blue-500/80 hover:bg-blue-600 text-white rounded text-sm font-bold backdrop-blur-sm transition-all"
                  onClick={pasteText}
                  title="Вставить"
                >
                  v
                </button>
                <button
                  className="w-8 h-8 bg-gray-500/80 hover:bg-gray-600 text-white rounded text-sm font-bold backdrop-blur-sm transition-all"
                  onClick={() => setInputText('')}
                  title="Очистить"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Voice Mode */}
          {currentMode === 'voice' && (
            <div className="text-center mb-4">
              <button
                className={`w-24 h-24 rounded-full border-none text-3xl cursor-pointer transition-all text-white shadow-lg mb-4 ${
                  isRecording
                    ? 'bg-gradient-to-br from-red-600 to-red-700 animate-pulse'
                    : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
                }`}
                onClick={toggleRecording}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              
              <div className="bg-white/5 rounded-xl p-4 text-white">
                {originalText}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all flex-1"
              onClick={translateText}
              disabled={isTranslating}
            >
              {isTranslating ? '⏳ Переводим...' : `🔄 ${currentLanguageConfig.buttons.translate}`}
            </button>
            
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all"
              onClick={clearText}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Translation Result */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold">
              {currentLanguageConfig.placeholders.outputLabel}
            </h2>
            <button
              className="px-3 py-1 bg-green-500/80 hover:bg-green-600 text-white rounded-lg text-sm font-bold transition-all"
              onClick={copyResult}
            >
              📄 Копировать
            </button>
          </div>

          <div className="rounded-xl p-4 bg-white text-gray-900 min-h-[100px] whitespace-pre-line">
            {translatedText || "Перевод появится здесь..."}
          </div>
        </div>

        {/* Footer Status */}
        <div className="bg-black/20 rounded-xl p-4 text-center text-white text-sm">
          <div className="font-bold mb-2">Samsung Galaxy S24</div>
          <div className="mb-3">Подключен через Wi-Fi</div>
          
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.ai ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>AI Server</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.ws ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>WebSocket</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.speech ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Speech API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTablet;