import { useState, useCallback, useEffect } from 'react'

export default function CollectionEditor({ value, onChange, readOnly = false }) {
  const [data, setData] = useState({})
  const [expanded, setExpanded] = useState({})

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      setData(parsed || {})
      // Auto-expand root level
      if (parsed && typeof parsed === 'object') {
        const initialExpanded = {}
        Object.keys(parsed).forEach(key => {
          initialExpanded[`root.${key}`] = true
        })
        setExpanded(initialExpanded)
      }
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
    
    // Auto-expand parent
    if (path) {
      setExpanded(prev => ({ ...prev, [path]: true }))
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

  const toggleExpand = useCallback((path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }, [])

  const moveField = useCallback((path, direction) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    const lastKey = parseInt(keys.pop())
    
    let current = newData
    for (const key of keys) current = current[key]
    
    if (!Array.isArray(current)) return
    
    const newIndex = lastKey + direction
    if (newIndex < 0 || newIndex >= current.length) return
    
    [current[lastKey], current[newIndex]] = [current[newIndex], current[lastKey]]
    updateData(newData)
  }, [data, updateData])

  // Type configuration
  const typeConfig = {
    string: { label: 'Text', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    number: { label: 'Number', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    boolean: { label: 'Boolean', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    null: { label: 'Null', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    object: { label: 'Object', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    array: { label: 'Array', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
  }

  // Render input element based on type
  const renderInput = (val, path, type) => {
    if (type === 'string') {
      return (
        <input
          type="text"
          className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-500"
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
          className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
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
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              val 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                : 'bg-bg-card text-gray-400 border border-border hover:border-gray-400'
            }`}
            onClick={() => updateValue(path, true)}
          >
            ✓ True
          </button>
          <button
            type="button"
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              !val 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-bg-card text-gray-400 border border-border hover:border-gray-400'
            }`}
            onClick={() => updateValue(path, false)}
          >
            ✕ False
          </button>
        </div>
      )
    }

    if (type === 'null') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <span className="text-purple-400 text-sm font-medium">null value</span>
        </div>
      )
    }

    if (type === 'object') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <span className="text-blue-400 text-sm font-medium">{Object.keys(val).length} fields</span>
        </div>
      )
    }

    if (type === 'array') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <span className="text-yellow-400 text-sm font-medium">{val.length} items</span>
        </div>
      )
    }

    return null
  }

  // Render full field row
  const renderField = (val, path, key, isArrayItem = false, depth = 0) => {
    const type = getType(val)
    const isExpandable = type === 'object' || type === 'array'
    const isEmpty = isExpandable && Object.keys(val).length === 0
    const isExpanded = expanded[path] !== false

    return (
      <div key={path} className="animate-in fade-in slide-in-from-top-2 duration-200">
        <div 
          className={`group relative rounded-xl transition-all ${
            depth > 0 ? 'ml-3' : ''
          }`}
        >
          {/* Field Card */}
          <div className={`bg-bg-card border border-border rounded-xl p-3 hover:border-gray-400 transition-all ${
            isExpandable ? 'hover:bg-bg-card/80' : ''
          }`}>
            <div className="flex items-start gap-3">
              {/* Expand/Collapse Button */}
              {isExpandable && (
                <button
                  onClick={() => toggleExpand(path)}
                  className="mt-0.5 p-1 rounded hover:bg-bg-secondary transition-colors flex-shrink-0"
                >
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {!isExpandable && <div className="w-6 flex-shrink-0" />}

              {/* Array Index / Key Input */}
              <div className="flex-shrink-0 min-w-0">
                {isArrayItem ? (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm font-mono">[{key}]</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-32 bg-bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-sm text-red-400 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                    value={key}
                    onChange={(e) => {
                      // Key rename functionality can be added here
                    }}
                    placeholder="field name"
                  />
                )}
              </div>

              {/* Colon */}
              <span className="text-gray-400 mt-1.5">:</span>

              {/* Value Input - Takes remaining space */}
              <div className="flex-1 min-w-0">
                {renderInput(val, path, type)}
              </div>

              {/* Type Selector */}
              <select
                className="flex-shrink-0 bg-bg-secondary border border-border rounded-lg px-2.5 py-2 text-xs text-gray-300 outline-none focus:border-accent cursor-pointer capitalize hover:border-gray-400 transition-colors"
                value={type}
                onChange={(e) => changeType(path, e.target.value)}
              >
                <option value="string">📝 Text</option>
                <option value="number">🔢 Number</option>
                <option value="boolean">⚡ Boolean</option>
                <option value="null">⚫ Null</option>
                <option value="object">📦 Object</option>
                <option value="array">📋 Array</option>
              </select>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Array Reorder Buttons */}
                {isArrayItem && (
                  <>
                    <button
                      onClick={() => moveField(path, -1)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-bg-secondary hover:text-accent transition-colors"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveField(path, 1)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-bg-secondary hover:text-accent transition-colors"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => deleteField(path)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete field"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Add Field Button for Objects */}
          {isExpandable && isExpanded && (
            <div className={`mt-2 ${depth > 0 ? 'ml-6' : 'ml-8'}`}>
              <button
                onClick={() => {
                  const newKey = prompt('Enter field name:')
                  if (newKey) addField(path, newKey, 'string')
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border text-gray-400 hover:border-accent hover:text-accent transition-all text-sm font-medium w-full justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add field to {isArrayItem ? `item ${key}` : `"${key}"`}
              </button>
            </div>
          )}
        </div>

        {/* Nested Fields */}
        {isExpandable && isExpanded && !isEmpty && (
          <div className={`mt-2 space-y-2 ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border' : 'ml-8 pl-4 border-l-2 border-border'}`}>
            {Object.entries(val).map(([k, v], index) => (
              <div key={k}>
                {renderField(v, `${path}.${k}`, k, Array.isArray(val), depth + 1)}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {isExpandable && isEmpty && isExpanded && (
          <div className={`mt-2 text-center py-4 ${depth > 0 ? 'ml-6' : 'ml-8'}`}>
            <div className="text-2xl mb-2">📭</div>
            <p className="text-gray-400 text-sm">
              {type === 'object' ? 'Empty object' : 'Empty array'}
            </p>
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
      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-border">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
            isArray 
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' 
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
          }`}>
            {isArray ? `[ ${fieldCount} items ]` : `{ ${fieldCount} fields }`}
          </div>
        </div>
        {!isArray && (
          <button
            onClick={handleAddRootField}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {fieldCount === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No fields yet</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
              Start building your document by adding fields. Each field can contain text, numbers, booleans, or even nested objects and arrays.
            </p>
            {!isArray && (
              <button
                onClick={handleAddRootField}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-blue-600 text-white font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
      {fieldCount > 0 && (
        <div className="mt-6 pt-4 border-t-2 border-border flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {fieldCount} fields
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              {JSON.stringify(data).length} bytes
            </span>
          </div>
          <span className="text-gray-500">
            {isArray ? 'Array' : 'Object'}
          </span>
        </div>
      )}
    </div>
  )
}
