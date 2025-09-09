import React from 'react'

interface StatusIndicatorProps {
  status: string
  className?: string
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  return (
    <div className={`glass-card p-4 text-center font-medium ${className}`}>
      {status}
    </div>
  )
}

export default StatusIndicator
