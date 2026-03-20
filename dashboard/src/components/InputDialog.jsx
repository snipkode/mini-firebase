import { useState } from 'react'

export default function InputDialog({ isOpen, onClose, onConfirm, title, label, placeholder = '', defaultValue = '', type = 'text', required = false }) {
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!value && required) return
    
    setLoading(true)
    await onConfirm(value)
    setLoading(false)
    setValue('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-bg-secondary border border-border rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            {/* Title */}
            <h3 className="text-base font-semibold mb-4">{title}</h3>
            
            {/* Input */}
            <div className="mb-5">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                {label}
              </label>
              {type === 'textarea' ? (
                <textarea
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  rows={type === 'textarea' ? 6 : 4}
                  required={required}
                  autoFocus
                />
              ) : (
                <input
                  type={type}
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  autoFocus
                />
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-bg-card hover:bg-border text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-accent hover:bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
