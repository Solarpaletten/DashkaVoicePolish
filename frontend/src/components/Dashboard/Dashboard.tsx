// src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { currentLanguageConfig } from '../../config/currentLanguage';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  // State управление
  const [currentRole, setCurrentRole] = useState<'user' | 'steuerberater'>('user');
  const [currentMode, setCurrentMode] = useState<'text' | 'voice'>('text');
  const [inputText, setInputText] = useState('');
  const [originalText, setOriginalText] = useState('Введите текст или нажмите на микрофон...');
  const [translatedText, setTranslatedText] = useState('Перевод появится здесь...');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('🟢 DashkaBot готов к работе');
  const [isTranslating, setIsTranslating] = useState(false);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState({
    ai: false,
    ws: false,
    speech: false
  });

  // Refs
  const recognitionRef = useRef<any>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // API Configuration
  const config = {
    aiServer: import.meta.env.VITE_API_URL || "https://api.dashkapolish.swapoil.de",
    wsServer: import.meta.env.VITE_WS_URL || "wss://api.dashkapolish.swapoil.de/ws",
    enableWebSocket: true,
    enableSpeech: true
  };

  // Initialize system
  useEffect(() => {
    initSystem();
    return () => {
      cleanup();
    };
  }, []);

  const initSystem = async () => {
    await checkAIServer();
    initWebSocket();
    initSpeechRecognition();
    setStatus('🟢 DashkaBot готов к работе');
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
  };

  // AI Server Check
  const checkAIServer = async () => {
    try {
      const response = await fetch(`${config.aiServer}/health`);
      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, ai: true }));
        console.log('✅ AI Server connected');
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, ai: false }));
      console.error('❌ AI Server not available:', error);
    }
  };

  // WebSocket initialization
  const initWebSocket = () => {
    if (!config.enableWebSocket) return;

    try {
      const ws = new WebSocket(config.wsServer);
      
      ws.onopen = () => {
        setConnectionStatus(prev => ({ ...prev, ws: true }));
        console.log('WebSocket connected');
      };

      ws.onclose = () => {
        setConnectionStatus(prev => ({ ...prev, ws: false }));
        console.log('WebSocket disconnected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onerror = (error) => {
        setConnectionStatus(prev => ({ ...prev, ws: false }));
        console.error('WebSocket error:', error);
      };

      websocketRef.current = ws;
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, ws: false }));
      console.error('WebSocket init failed:', error);
    }
  };

  // Speech Recognition
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setConnectionStatus(prev => ({ ...prev, speech: false }));
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = currentRole === 'user' ? 'ru-RU' : 'pl-PL';

    recognition.onstart = () => {
      setConnectionStatus(prev => ({ ...prev, speech: true }));
      setStatus('🎤 Запись началась... Говорите сколько угодно времени');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const currentText = finalTranscript + interimTranscript;
      if (currentText.trim()) {
        setOriginalText(currentText);
        setStatus('🎤 Записываю... Нажмите ⏹️ когда закончите');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setStatus('🔇 Не слышу речь... Продолжайте говорить');
        return;
      }
      
      setStatus(`❌ Ошибка: ${event.error}`);
      stopRecording();
    };

    recognition.onend = () => {
      console.log('📚 Recognition ended');
      if (isRecording) {
        try {
          recognition.start();
        } catch (err) {
          console.log('Cannot restart:', err);
          stopRecording();
        }
      }
    };

    recognitionRef.current = recognition;
    setConnectionStatus(prev => ({ ...prev, speech: true }));
  };

  // Translation function
  const performTranslation = async (text: string) => {
    setIsTranslating(true);
    setOriginalText(text);
    setStatus('🔄 Перевожу...');

    try {
      const fromLang = currentRole === 'user' ? 'RU' : 'PL';
      const toLang = currentRole === 'user' ? 'PL' : 'RU';

      const response = await fetch(`${config.aiServer}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          source_language: fromLang,
          target_language: toLang
        })
      });

      if (!response.ok) {
        throw new Error(`AI Server error: ${response.status}`);
      }

      const result = await response.json();
      const translation = result.translated_text || '[Ошибка перевода]';

      setTranslatedText(translation);
      setStatus(`✅ Переведено! (${fromLang} → ${toLang})`);

      // WebSocket message
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        const wsMessage = {
          type: 'translation',
          role: currentRole,
          original: text,
          translation: translation,
          from: fromLang.toLowerCase(),
          to: toLang.toLowerCase(),
          timestamp: new Date().toISOString()
        };
        websocketRef.current.send(JSON.stringify(wsMessage));
      }

    } catch (error: any) {
      console.error('Translation error:', error);
      setStatus('❌ Ошибка перевода: ' + error.message);
      setTranslatedText('Ошибка: ' + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  // Recording controls
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setStatus('❌ Распознавание речи недоступно');
      return;
    }

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setStatus('🎤 Слушаю... Нажмите ⏹️ для остановки');
    setOriginalText('Говорите сейчас... (нажмите ⏹️ когда закончите)');
    setTranslatedText('Перевод появится после остановки...');

    try {
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      setStatus('❌ Не удалось начать запись');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('⏸️ Остановлено. Обработка...');

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setTimeout(() => {
      const recordedText = originalText;
      if (recordedText && recordedText !== 'Говорите сейчас... (нажмите ⏹️ когда закончите)' && recordedText.trim()) {
        setStatus('✅ Готово! Можете нажать "Перевести" или подождать автоперевод');
        // Автоперевод через 3 секунды
        setTimeout(() => {
          if (!isRecording && recordedText === originalText) {
            performTranslation(recordedText);
          }
        }, 3000);
      } else {
        setStatus('❌ Текст не записан. Попробуйте еще раз');
      }
    }, 1000);
  };

  // Text functions
  const translateText = async () => {
    const text = inputText.trim();
    if (!text) {
      setStatus('❌ Введите текст для перевода');
      return;
    }
    await performTranslation(text);
  };

  const translateCurrentText = async () => {
    const textFromInput = inputText.trim();
    const textFromOriginal = originalText;

    let text = '';
    if (currentMode === 'text' && textFromInput) {
      text = textFromInput;
    } else if (textFromOriginal && textFromOriginal !== 'Введите текст или нажмите на микрофон...') {
      text = textFromOriginal;
    }

    if (!text) {
      setStatus('❌ Нет текста для перевода');
      return;
    }

    await performTranslation(text);
  };

  const clearText = () => {
    setInputText('');
    setOriginalText('Введите текст или нажмите на микрофон...');
    setTranslatedText('Перевод появится здесь...');
    setStatus('🟢 DashkaBot готов к работе');
  };

  // Utility functions
  const pasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setStatus('📋 Текст вставлен из буфера обмена');
    } catch (error) {
      console.error('Paste failed:', error);
      setStatus('❌ Не удалось вставить текст');
    }
  };

  const copyResult = async () => {
    if (translatedText && translatedText !== 'Перевод появится здесь...') {
      try {
        await navigator.clipboard.writeText(translatedText);
        setStatus('📄 Перевод скопирован в буфер обмена');
      } catch (error) {
        console.error('Copy failed:', error);
        setStatus('❌ Не удалось скопировать текст');
      }
    } else {
      setStatus('❌ Нет текста для копирования');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'translation' && data.role !== currentRole) {
      setOriginalText(`[${data.role}]: ${data.original}`);
      setTranslatedText(data.translation);
      setStatus(`📨 Получен перевод от ${data.role}`);
    }
  };

  // Role switching
  const handleRoleChange = (role: 'user' | 'steuerberater') => {
    setCurrentRole(role);
    const roleName = role === 'user' ? 'Russian Speaker 🇷🇺' : 'Polish Speaker 🇵🇱';
    setStatus('Роль: ' + roleName);

    if (recognitionRef.current) {
      recognitionRef.current.lang = role === 'user' ? 'ru-RU' : 'pl-PL';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 p-4">
      <div className="max-w-md mx-auto glass rounded-3xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentLanguageConfig.app.title}
          </h1>
          <p className="text-white/80 text-sm">
            {currentLanguageConfig.app.subtitle}
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-3 mb-8">
          <button
            className={`language-btn flex-1 ${currentRole === 'user' ? 'active' : 'inactive'}`}
            onClick={() => handleRoleChange('user')}
          >
            🇷🇺 {currentLanguageConfig.languageSelector.sourceLabel}
          </button>
          <button
            className={`language-btn flex-1 ${currentRole === 'steuerberater' ? 'active' : 'inactive'}`}
            onClick={() => handleRoleChange('steuerberater')}
          >
            🇵🇱 {currentLanguageConfig.languageSelector.targetLabel}
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex mb-6 bg-black/20 rounded-xl p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              currentMode === 'text' 
                ? 'bg-white/20 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
            onClick={() => setCurrentMode('text')}
          >
            📝 Текст
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
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
        <div className="bg-white/20 p-4 rounded-xl mb-6 text-center text-white font-medium">
          {status}
        </div>

        {/* Text Mode */}
        {currentMode === 'text' && (
          <div className="space-y-4 mb-6">
            <div className="relative">
              <textarea
                className="textarea-field w-full min-h-[80px] pr-12"
                placeholder={currentLanguageConfig.placeholders.inputText}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    translateText();
                  }
                }}
              />
              
              {/* Floating buttons */}
              <div className="absolute right-2 top-2 flex flex-col gap-1">
                <button
                  className="w-7 h-7 bg-blue-500/80 hover:bg-blue-600 text-white rounded text-xs font-bold backdrop-blur-sm transition-all hover:scale-110"
                  onClick={pasteText}
                  title="Вставить"
                >
                  v
                </button>
                <button
                  className="w-7 h-7 bg-gray-500/80 hover:bg-gray-600 text-white rounded text-xs font-bold backdrop-blur-sm transition-all hover:scale-110"
                  onClick={() => setInputText('')}
                  title="Очистить"
                >
                  ×
                </button>
                <button
                  className="w-7 h-7 bg-green-500/80 hover:bg-green-600 text-white rounded text-xs font-bold backdrop-blur-sm transition-all hover:scale-110"
                  onClick={copyResult}
                  title="Копировать"
                >
                  c
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={translateText}
                disabled={isTranslating}
              >
                {isTranslating ? '⏳ Переводим...' : `🔄 ${currentLanguageConfig.buttons.translate}`}
              </button>
              <button
                className="btn-secondary"
                onClick={clearText}
              >
                🗑️ {currentLanguageConfig.buttons.clear}
              </button>
            </div>
          </div>
        )}

        {/* Voice Mode */}
        {currentMode === 'voice' && (
          <div className="space-y-6 mb-6">
            <div className="text-center">
              <button
                className={`w-32 h-32 rounded-full border-none text-4xl cursor-pointer transition-all text-white shadow-lg ${
                  isRecording 
                    ? 'bg-gradient-to-br from-red-600 to-red-700 animate-pulse' 
                    : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } ${isRecording ? '' : 'hover:scale-105'} active:scale-95`}
                onClick={toggleRecording}
                disabled={!recognitionRef.current}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              <div className="mt-4 text-white/90 text-center">
                {isRecording ? 'Говорите... Нажмите для остановки' : 'Нажмите для записи'}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={translateCurrentText}
                disabled={isTranslating}
              >
                {isTranslating ? '⏳ Переводим...' : `🔄 ${currentLanguageConfig.buttons.translate}`}
              </button>
              <button
                className="btn-secondary"
                onClick={clearText}
              >
                🗑️ {currentLanguageConfig.buttons.clear}
              </button>
            </div>
          </div>
        )}

        {/* Translation Results */}
        <div className="translation-result mb-6">
          <div className="text-gray-600 text-sm mb-2 font-medium">
            {currentLanguageConfig.placeholders.sourceText}
          </div>
          <div className="text-gray-800 font-medium mb-4 min-h-[24px] break-words">
            {originalText}
          </div>

          <div className="text-gray-600 text-sm mb-2 font-medium">
            {currentLanguageConfig.placeholders.outputLabel}
          </div>
          <div className="text-gray-800 font-medium min-h-[24px] break-words">
            {translatedText}
          </div>
        </div>

        {/* Device Info & Status */}
        <div className="bg-black/20 p-4 rounded-xl text-center text-white text-sm">
          <div className="font-bold mb-2">Samsung Galaxy S24</div>
          <div className="mb-3">Подключен через Wi-Fi</div>
          
          <div className="flex justify-between text-xs">
            <div className="status-indicator">
              <span className={`status-dot ${connectionStatus.ai ? 'status-connected' : 'status-disconnected'}`}></span>
              AI Server
            </div>
            <div className="status-indicator">
              <span className={`status-dot ${connectionStatus.ws ? 'status-connected' : 'status-disconnected'}`}></span>
              WebSocket
            </div>
            <div className="status-indicator">
              <span className={`status-dot ${connectionStatus.speech ? 'status-connected' : 'status-disconnected'}`}></span>
              Speech API
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;