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
