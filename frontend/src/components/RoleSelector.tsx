import React from 'react'
import type { UserRole } from '../types'

interface RoleSelectorProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onRoleChange('russian')}
        className={`role-button bg-dashka-accent text-white ${
          currentRole === 'russian' ? 'role-button-active' : 'opacity-70'
        }`}
      >
        🇷🇺 Russian Speaker
      </button>
      
      <button
        onClick={() => onRoleChange('polish')}
        className={`role-button bg-dashka-error text-white ${
          currentRole === 'polish' ? 'role-button-active' : 'opacity-70'
        }`}
      >
        🇵🇱 Polish Speaker
      </button>
    </div>
  )
}

export default RoleSelector
