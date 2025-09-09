import React from 'react'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onEnterPress?: () => void
  className?: string
}

const TextInput: React.FC<TextInputProps> = ({ 
  value, 
  onChange, 
  placeholder = '',
  onEnterPress,
  className = '' 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && onEnterPress) {
      onEnterPress()
    }
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyPress}
      placeholder={placeholder}
      className={`input-glass w-full min-h-[80px] resize-y ${className}`}
      rows={3}
    />
  )
}

export default TextInput
