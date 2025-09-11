// ========================================
// 2. ОБЩИЙ ХУК ДЛЯ ПЕРЕИСПОЛЬЗОВАНИЯ ЛОГИКИ
// ========================================
// src/hooks/useTranslator.ts
import { useState, useEffect, useRef } from 'react';

export const useTranslator = () => {
  // State управление
  const [currentRole, setCurrentRole] = useState<'user' | 'steuerberater'>('user');
  const [currentMode, setCurrentMode] = useState<'text' | 'voice'>('text');
  const [inputText, setInputText] = useState('');
  const [originalText, setOriginalText] = useState('Введите текст или нажмите на микрофон...');
  const [translatedText, setTranslatedText] = useState('Перевод появится здесь...');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('🟢 DashkaBot готов к работе');
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);

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
    return () => cleanup();
  }, []);

  const initSystem = async () => {
    await checkAIServer();
    initWebSocket();
    initSpeechRecognition();
    setStatus('🟢 DashkaBot готов к работе');
  };

  const cleanup = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (websocketRef.current) websocketRef.current.close();
  };

  // AI Server Check
  const checkAIServer = async () => {
    try {
      const response = await fetch(`${config.aiServer}/health`);
      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, ai: true }));
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, ai: false }));
    }
  };

  // WebSocket initialization
  const initWebSocket = () => {
    if (!config.enableWebSocket) return;
    try {
      const ws = new WebSocket(config.wsServer);
      ws.onopen = () => setConnectionStatus(prev => ({ ...prev, ws: true }));
      ws.onclose = () => setConnectionStatus(prev => ({ ...prev, ws: false }));
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      ws.onerror = () => setConnectionStatus(prev => ({ ...prev, ws: false }));
      websocketRef.current = ws;
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, ws: false }));
    }
  };

  // Speech Recognition
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setConnectionStatus(prev => ({ ...prev, speech: false }));
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
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setStatus('🔇 Не слышу речь... Продолжайте говорить');
        return;
      }
      setStatus(`❌ Ошибка: ${event.error}`);
      stopRecording();
    };

    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start();
        } catch (err) {
          stopRecording();
        }
      }
    };

    recognitionRef.current = recognition;
    setConnectionStatus(prev => ({ ...prev, speech: true }));
  };

  // Speech synthesis
  const speakTranslation = (text: string, language: string) => {
    if (!('speechSynthesis' in window)) return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'pl' ? 'pl-PL' : 'ru-RU';

    const voices = speechSynthesis.getVoices();
    const preferredGender = language === 'pl' ? 'male' : 'female';
    const selectedVoice = voices.find(voice =>
      voice.lang.includes(language) &&
      voice.name.toLowerCase().includes(preferredGender)
    ) || voices.find(voice => voice.lang.includes(language));

    if (selectedVoice) utterance.voice = selectedVoice;

    if (language === 'pl') {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
    } else {
      utterance.pitch = 1.2;
      utterance.rate = 0.8;
    }

    utterance.volume = 1.0;
    speechSynthesis.speak(utterance);
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
        headers: { 'Content-Type': 'application/json' },
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

      const targetLang = toLang.toLowerCase();
      speakTranslation(translation, targetLang);

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
    if (!isRecording) startRecording();
    else stopRecording();
  };

  const startRecording = () => {
    setIsRecording(true);
    setStatus('🎤 Слушаю... Нажмите ⏹️ для остановки');
    setOriginalText('Говорите сейчас... (нажмите ⏹️ когда закончите)');
    setTranslatedText('Перевод появится после остановки...');

    try {
      recognitionRef.current.start();
    } catch (error: any) {
      setStatus('❌ Не удалось начать запись');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('⏸️ Остановлено. Обработка...');

    if (recognitionRef.current) recognitionRef.current.stop();

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
      setStatus('❌ Не удалось вставить текст');
    }
  };

  const copyResult = async () => {
    if (translatedText && translatedText !== 'Перевод появится здесь...') {
      try {
        await navigator.clipboard.writeText(translatedText);
        setStatus('📄 Перевод скопирован в буфер обмена');
      } catch (error) {
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

  return {
    // State
    currentRole,
    currentMode,
    inputText,
    originalText,
    translatedText,
    isRecording,
    status,
    isTranslating,
    autoTranslate,
    connectionStatus,
    
    // Setters
    setCurrentMode,
    setInputText,
    setAutoTranslate,
    
    // Functions
    handleRoleChange,
    toggleRecording,
    translateText,
    translateCurrentText,
    clearText,
    pasteText,
    copyResult,
    performTranslation
  };
};