export type UserRole = 'russian' | 'polish'

export interface ConnectionStatus {
  api: boolean
  websocket: boolean
  speech: boolean
}

export interface TranslationRequest {
  text: string
  source_language: string
  target_language: string
}

export interface TranslationResponse {
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  confidence?: number
  timestamp: string
}

export interface WebSocketMessage {
  type: 'translation' | 'status' | 'role_change'
  role: UserRole
  original?: string
  translation?: string
  from?: string
  to?: string
  timestamp: string
}

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}
