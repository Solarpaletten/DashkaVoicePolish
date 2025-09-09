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
