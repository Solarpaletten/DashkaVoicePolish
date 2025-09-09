import React from 'react'

interface TranslationAreaProps {
  originalText: string
  translatedText: string
  className?: string
}

const TranslationArea: React.FC<TranslationAreaProps> = ({ 
  originalText, 
  translatedText, 
  className = '' 
}) => {
  return (
    <div className={`translation-area ${className}`}>
      <div className="space-y-4">
        <div>
          <div className="text-sm opacity-80 mb-2">Исходный текст:</div>
          <div className="text-base font-medium leading-relaxed min-h-[24px] break-words">
            {originalText}
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-4">
          <div className="text-sm opacity-80 mb-2">Перевод:</div>
          <div className="text-base font-medium leading-relaxed min-h-[24px] break-words">
            {translatedText}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranslationArea
