import { useState } from 'react'
import { translateText } from '../services/api'

interface TranslationRequest {
  text: string
  fromLang: string
  toLang: string
}

interface UseTranslationReturn {
  translate: (request: TranslationRequest) => Promise<void>
  result: string
  isLoading: boolean
  error: string | null
}

export const useTranslation = (): UseTranslationReturn => {
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const translate = async (request: TranslationRequest) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Исправляем вызов: передаем все 3 параметра
      const response = await translateText(request.text, request.fromLang, request.toLang)
      
      if (response.status === 'success') {
        setResult(response.translated_text)
      } else {
        throw new Error(response.message || 'Translation failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setResult('')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    translate,
    result,
    isLoading,
    error
  }
}