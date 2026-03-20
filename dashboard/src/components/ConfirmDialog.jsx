import { useState } from 'react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = 'info' }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  const typeStyles = {
    info: { icon: '⚠️', confirm: 'bg-accent hover:bg-blue-600' },
    danger: { icon: '🗑️', confirm: 'bg-red-500 hover:bg-red-600' },
    success: { icon: '✅', confirm: 'bg-green-500 hover:bg-green-600' }
  }

  const style = typeStyles[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-bg-secondary border border-border rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <div className="p-5">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-bg-card flex items-center justify-center text-2xl mb-3 mx-auto">
            {style.icon}
          </div>
          
          {/* Title */}
          <h3 className="text-base font-semibold text-center mb-2">{title}</h3>
          
          {/* Message */}
          <p className="text-sm text-gray-400 text-center mb-5">{message}</p>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-bg-card hover:bg-border text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 ${style.confirm} text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                type === 'danger' ? 'Delete' : 'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
