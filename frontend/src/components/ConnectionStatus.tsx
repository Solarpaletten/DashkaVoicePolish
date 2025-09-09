import React from 'react'
import type { ConnectionStatus } from '../types'

interface ConnectionStatusProps {
  status: ConnectionStatus
  className?: string
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, className = '' }) => {
  const connections = [
    { key: 'api', label: 'API Server' },
    { key: 'websocket', label: 'WebSocket' },
    { key: 'speech', label: 'Speech API' }
  ]

  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="text-sm font-medium text-center mb-3 opacity-80">
        Статус подключения
      </div>
      
      <div className="flex justify-around text-xs">
        {connections.map(({ key, label }) => (
          <div key={key} className="flex items-center">
            <span 
              className={`connection-dot ${
                status[key as keyof ConnectionStatus] 
                  ? 'connection-connected' 
                  : 'connection-disconnected'
              }`} 
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConnectionStatus
