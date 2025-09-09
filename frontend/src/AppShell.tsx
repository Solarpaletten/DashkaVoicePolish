import React, { useState } from 'react'

const AppShell: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'russian' | 'polish'>('russian')
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          source_language: currentRole === 'russian' ? 'ru' : 'pl',
          target_language: currentRole === 'russian' ? 'pl' : 'ru'
        })
      })
      
      const result = await response.json()
      setTranslatedText(result.translated_text || 'Ошибка перевода')
    } catch (error) {
      setTranslatedText('Ошибка подключения к серверу')
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🚀 DashkaBot</h1>
          <p className="text-white/80">Russian ↔ Polish Voice Translator</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentRole('russian')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold ${
              currentRole === 'russian' 
                ? 'bg-dashka-accent text-white scale-105' 
                : 'bg-white/20 text-white/80'
            } transition-all`}
          >
            🇷🇺 Russian
          </button>
          <button
            onClick={() => setCurrentRole('polish')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold ${
              currentRole === 'polish' 
                ? 'bg-red-500 text-white scale-105' 
                : 'bg-white/20 text-white/80'
            } transition-all`}
          >
            🇵🇱 Polish
          </button>
        </div>

        {/* Input */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Введите текст для перевода..."
          className="w-full p-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 min-h-[100px]"
        />

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          className="button-primary w-full"
        >
          🔄 Перевести
        </button>

        {/* Result */}
        {translatedText && (
          <div className="glass-card p-6">
            <div className="text-sm opacity-80 mb-2">Перевод:</div>
            <div className="text-lg">{translatedText}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppShell
