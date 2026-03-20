import { useState, useCallback, useEffect } from 'react'

export default function CollectionEditor({ value, onChange, readOnly = false }) {
  const [data, setData] = useState({})

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      setData(parsed || {})
    } catch {
      setData({})
    }
  }, [value])

  const updateData = useCallback((newData) => {
    setData(newData)
    onChange(JSON.stringify(newData, null, 2))
  }, [onChange])

  const getType = (val) => {
    if (val === null) return 'null'
    if (Array.isArray(val)) return 'array'
    return typeof val
  }

  const getDefaultValue = (type) => {
    const defaults = {
      string: '',
      number: 0,
      boolean: false,
      null: null,
      object: {},
      array: []
    }
    return defaults[type] || ''
  }

  const addField = useCallback((path, newKey, type = 'string') => {
    if (!newKey?.trim()) return
    
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path ? path.split('.').slice(1) : []
    let current = newData
    
    for (const key of keys) {
      if (current[key] === undefined) current[key] = {}
      current = current[key]
    }
    
    if (Array.isArray(current)) {
      current.push(getDefaultValue(type))
    } else {
      current[newKey] = getDefaultValue(type)
    }
    
    updateData(newData)
  }, [data, updateData])

  const deleteField = useCallback((path) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    const lastKey = keys.pop()
    
    let current = newData
    for (const key of keys) current = current[key]
    
    if (Array.isArray(current)) {
      current.splice(parseInt(lastKey), 1)
    } else {
      delete current[lastKey]
    }
    
    updateData(newData)
  }, [data, updateData])

  const updateValue = useCallback((path, newValue) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    
    let current = newData
    for (const key of keys.slice(0, -1)) current = current[key]
    
    const lastKey = keys[keys.length - 1]
    current[lastKey] = newValue
    updateData(newData)
  }, [data, updateData])

  const changeType = useCallback((path, newType) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    
    let current = newData
    for (const key of keys.slice(0, -1)) current = current[key]
    
    const lastKey = keys[keys.length - 1]
    current[lastKey] = getDefaultValue(newType)
    updateData(newData)
  }, [data, updateData])

  const moveField = useCallback((path, direction) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    const lastKey = parseInt(keys.pop())
    
    let current = newData
    for (const key of keys) current = current[key]
    
    if (!Array.isArray(current)) return
    
    const newIndex = lastKey + direction
    if (newIndex < 0 || newIndex >= current.length) return
    
    // Swap items
    [current[lastKey], current[newIndex]] = [current[newIndex], current[lastKey]]
    updateData(newData)
  }, [data, updateData])

  // Render input element based on type
  const renderInput = (val, path, type) => {
    if (type === 'string') {
      return (
        <input
          type="text"
          className="w-full bg-bg-card border border-border rounded px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          value={val}
          onChange={(e) => updateValue(path, e.target.value)}
          placeholder="Enter text..."
        />
      )
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          className="w-32 bg-bg-card border border-border rounded px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          value={val}
          onChange={(e) => updateValue(path, parseFloat(e.target.value) || 0)}
        />
      )
    }

    if (type === 'boolean') {
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              val 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-bg-card text-gray-400 border border-border'
            }`}
            onClick={() => updateValue(path, true)}
          >
            true
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              !val 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-bg-card text-gray-400 border border-border'
            }`}
            onClick={() => updateValue(path, false)}
          >
            false
          </button>
        </div>
      )
    }

    if (type === 'null') {
      return (
        <span className="text-purple-400 text-sm italic px-2 py-1">null</span>
      )
    }

    return null
  }

  // Render full field row
  const renderField = (val, path, key, isArrayItem = false, depth = 0) => {
    const type = getType(val)
    const isExpandable = type === 'object' || type === 'array'
    const isEmpty = isExpandable && Object.keys(val).length === 0

    return (
      <div key={path} className="group">
        <div className={`flex items-start gap-2 p-2.5 rounded-lg hover:bg-bg-secondary transition-colors ${depth > 0 ? 'ml-4' : ''}`}>
          {/* Drag/Reorder handles for arrays */}
          {isArrayItem && (
            <div className="flex flex-col gap-0.5 mt-2">
              <button
                onClick={() => moveField(path, -1)}
                className="p-0.5 text-gray-500 hover:text-accent transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveField(path, 1)}
                className="p-0.5 text-gray-500 hover:text-accent transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* Key Input */}
          {!isArrayItem && (
            <input
              type="text"
              className="w-32 bg-bg-card border border-border rounded px-2.5 py-1.5 text-sm text-red-400 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
              value={key}
              onChange={(e) => {
                const newKey = e.target.value
                if (!newKey) return
                // In a real implementation, you'd rename the key here
              }}
              placeholder="key"
            />
          )}

          {/* Colon separator */}
          <span className="text-gray-400 mt-2">:</span>

          {/* Value Input */}
          <div className="flex-1">
            {renderInput(val, path, type)}
          </div>

          {/* Type Selector */}
          <select
            className="bg-bg-card border border-border rounded px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {/* Delete Button */}
          <button
            onClick={() => deleteField(path)}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete field"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Add Field Button for Objects */}
        {type === 'object' && (
          <div className="ml-4 mt-2">
            <button
              onClick={() => {
                const newKey = prompt('Enter field name:')
                if (newKey) addField(path, newKey, 'string')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-accent hover:bg-accent/10 transition-colors text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add field to {key}
            </button>
          </div>
        )}

        {/* Nested Fields */}
        {isExpandable && !isEmpty && (
          <div className="mt-2 space-y-1">
            {Object.entries(val).map(([k, v], index) => (
              <div key={k}>
                {renderField(v, `${path}.${k}`, k, Array.isArray(val), depth + 1)}
              </div>
            ))}
          </div>
        )}

        {/* Empty State for Objects/Arrays */}
        {isExpandable && isEmpty && (
          <div className="ml-4 mt-2 text-gray-500 text-xs italic">
            {type === 'object' ? 'Empty object' : 'Empty array'}
          </div>
        )}
      </div>
    )
  }

  const handleAddRootField = () => {
    const newKey = prompt('Enter field name:')
    if (newKey) addField('', newKey, 'string')
  }

  const isArray = Array.isArray(data)
  const fieldCount = isArray ? data.length : Object.keys(data).length

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isArray ? 'text-yellow-400' : 'text-blue-400'}`}>
            {isArray ? `[ Array: ${fieldCount} items ]` : `{ Object: ${fieldCount} fields }`}
          </span>
        </div>
        {!isArray && (
          <button
            onClick={handleAddRootField}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-1">
        {fieldCount === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-gray-400 text-sm mb-3">No fields yet</p>
            {!isArray && (
              <button
                onClick={handleAddRootField}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                Add Your First Field
              </button>
            )}
          </div>
        ) : (
          Object.entries(data).map(([key, val]) => 
            renderField(val, `root.${key}`, key, isArray)
          )
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-gray-400">
        <span>Total fields: {fieldCount}</span>
        <span>Size: {JSON.stringify(data).length} bytes</span>
      </div>
    </div>
  )
}
