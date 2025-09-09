#!/usr/bin/env bash
set -euo pipefail

echo "🔧 AI IT SOLAR - Исправление Frontend ошибок"
echo "==========================================="

# 1. Добавляем недостающие зависимости
echo "📦 Добавляем недостающие пакеты..."
npm install lucide-react @types/dom-speech-recognition

# 2. Создаем типы для Vite env
echo "📝 Создаем типы для Vite..."
mkdir -p src/types
cat > src/types/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_VERSION: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
EOF

# 3. Исправляем VoiceButton.tsx
echo "🎤 Исправляем VoiceButton компонент..."
cat > src/components/VoiceButton.tsx << 'EOF'
import React from 'react'
import { Mic, MicOff } from 'lucide-react'

interface VoiceButtonProps {
  isListening: boolean
  onStartListening: () => void
  onStopListening: () => void
  disabled?: boolean
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  onStartListening,
  onStopListening,
  disabled = false
}) => {
  const handleClick = () => {
    if (isListening) {
      onStopListening()
    } else {
      onStartListening()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-full transition-all duration-300 
        ${isListening 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
          : 'bg-blue-500 hover:bg-blue-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        text-white shadow-lg hover:shadow-xl transform hover:scale-105
      `}
    >
      {isListening ? (
        <MicOff className="w-6 h-6" />
      ) : (
        <Mic className="w-6 h-6" />
      )}
      
      {isListening && (
        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
      )}
    </button>
  )
}
EOF

# 4. Исправляем useVoiceRecognition.ts
echo "🗣️ Исправляем useVoiceRecognition хук..."
cat > src/hooks/useVoiceRecognition.ts << 'EOF'
import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecognitionReturn {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  isSupported: boolean
}

// Расширяем интерфейс SpeechRecognition
interface ExtendedSpeechRecognition extends SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export const useVoiceRecognition = (language = 'ru-RU'): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null)

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition() as ExtendedSpeechRecognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return recognition
  }, [language, isSupported])

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition not supported')
      return
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition()
      }
      
      recognitionRef.current?.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
    }
  }, [initializeRecognition, isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  }
}
EOF

# 5. Исправляем useWebSocket.ts и api.ts
echo "🔌 Исправляем WebSocket и API сервисы..."
cat > src/hooks/useWebSocket.ts << 'EOF'
import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.DEV ? 'ws://localhost:8080/ws' : `ws://${window.location.host}/ws`

interface UseWebSocketReturn {
  isConnected: boolean
  sendMessage: (message: any) => void
  lastMessage: any
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(WS_URL)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log('WebSocket connected')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')
        
        // Автоматическое переподключение через 3 секунды
        setTimeout(connect, 3000)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    connect()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected,
    sendMessage,
    lastMessage
  }
}
EOF

cat > src/services/api.ts << 'EOF'
const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin

export const translateText = async (text: string, fromLang: string, toLang: string) => {
  try {
    const response = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_language: fromLang,
        target_language: toLang,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Translation API error:', error)
    throw error
  }
}

export const getLanguages = async () => {
  try {
    const response = await fetch(`${API_BASE}/languages`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Languages API error:', error)
    throw error
  }
}

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Health check error:', error)
    throw error
  }
}
EOF

echo ""
echo "✅ Все ошибки исправлены!"
echo "🎯 Теперь запускаем:"
echo "   npm run build  # Проверить сборку"
echo "   npm run dev    # Запустить dev сервер"