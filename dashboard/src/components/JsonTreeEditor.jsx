import { useState } from 'react'

export default function JsonTreeEditor({ value, onChange, readOnly = false }) {
  const [expanded, setExpanded] = useState({})

  const parseValue = (val) => {
    try {
      return typeof val === 'string' ? JSON.parse(val) : val
    } catch {
      return val
    }
  }

  const data = parseValue(value)

  const toggleKey = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const renderValue = (val, path, key) => {
    const isExpanded = expanded[path]
    const isObject = val !== null && typeof val === 'object'
    const isArray = Array.isArray(val)
    const isEmpty = isObject && Object.keys(val).length === 0

    if (val === null) {
      return (
        <span className="text-purple-400">null</span>
      )
    }

    if (typeof val === 'boolean') {
      return (
        <span className="text-orange-400">{val.toString()}</span>
      )
    }

    if (typeof val === 'number') {
      return (
        <span className="text-green-400">{val}</span>
      )
    }

    if (typeof val === 'string') {
      return (
        <span className="text-green-400">"{val}"</span>
      )
    }

    if (isArray) {
      if (isEmpty || !isExpanded) {
        return (
          <span>
            <span className="text-yellow-400">[</span>
            {isEmpty ? (
              <span className="text-gray-500"> empty</span>
            ) : (
              <span className="text-gray-400"> {val.length} items</span>
            )}
            {!isEmpty && (
              <button
                onClick={() => toggleKey(path)}
                className="ml-1 text-gray-400 hover:text-accent text-xs"
              >
                ▶
              </button>
            )}
            <span className="text-yellow-400">]</span>
          </span>
        )
      }

      return (
        <span>
          <span className="text-yellow-400">[</span>
          <div className="ml-4 border-l border-border pl-2">
            {val.map((item, index) => (
              <div key={index} className="py-0.5">
                <span className="text-gray-500 text-xs mr-2">{index}:</span>
                {renderValue(item, `${path}.${index}`, index)}
                {index < val.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
          <span className="text-yellow-400">]</span>
        </span>
      )
    }

    if (isObject) {
      const keys = Object.keys(val)
      if (isEmpty || !isExpanded) {
        return (
          <span>
            <span className="text-blue-400">{'{'}</span>
            {isEmpty ? (
              <span className="text-gray-500"> empty</span>
            ) : (
              <span className="text-gray-400"> {keys.length} keys</span>
            )}
            {!isEmpty && (
              <button
                onClick={() => toggleKey(path)}
                className="ml-1 text-gray-400 hover:text-accent text-xs"
              >
                ▶
              </button>
            )}
            <span className="text-blue-400">{'}'}</span>
          </span>
        )
      }

      return (
        <span>
          <span className="text-blue-400">{'{'}</span>
          <div className="ml-4 border-l border-border pl-2">
            {keys.map((k, index) => (
              <div key={k} className="py-0.5">
                <span 
                  className="text-red-400 cursor-pointer hover:underline text-xs"
                  onClick={() => !readOnly && handleEditKey(path, k)}
                >
                  "{k}"
                </span>
                <span className="text-gray-400">: </span>
                {renderValue(val[k], `${path}.${k}`, k)}
                {index < keys.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
          <span className="text-blue-400">{'}'}</span>
        </span>
      )
    }

    return <span className="text-gray-300">{String(val)}</span>
  }

  const handleEditKey = (parentPath, key) => {
    if (readOnly) return
    const newKey = prompt('Edit key name:', key)
    if (newKey && newKey !== key) {
      // Handle key rename logic here if needed
    }
  }

  const handleAddField = (path) => {
    if (readOnly) return
    const newKey = prompt('Enter field name:')
    if (!newKey) return
    const newValue = prompt('Enter value (JSON):', '""')
    if (!newValue) return
    
    try {
      const parsed = JSON.parse(newValue)
      // This would need parent reference to actually update
      console.log('Add field:', path, newKey, parsed)
    } catch {
      alert('Invalid JSON')
    }
  }

  const handleDeleteField = (path, key) => {
    if (readOnly) return
    if (confirm(`Delete "${key}"?`)) {
      // Handle delete logic here
      console.log('Delete:', path, key)
    }
  }

  if (typeof data !== 'object' || data === null) {
    return (
      <div className="font-mono text-sm">
        {renderValue(data, 'root', 'root')}
      </div>
    )
  }

  return (
    <div className="font-mono text-sm bg-bg-card rounded-lg p-3 overflow-x-auto">
      {renderValue(data, 'root', 'root')}
    </div>
  )
}
