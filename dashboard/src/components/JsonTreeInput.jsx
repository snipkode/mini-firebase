import { useState, useCallback, useEffect } from 'react'

export default function JsonTreeInput({ value, onChange }) {
  const [expanded, setExpanded] = useState({})
  const [data, setData] = useState({})
  const [newFieldPath, setNewFieldPath] = useState(null)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState('string')

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

  const toggleExpand = useCallback((path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }, [])

  const showAddField = (path) => {
    setNewFieldPath(path)
    setNewFieldName('')
    setNewFieldType('string')
  }

  const cancelAddField = () => {
    setNewFieldPath(null)
    setNewFieldName('')
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
    cancelAddField()
  }, [data, updateData, getDefaultValue])

  const handleAddFieldSubmit = (e) => {
    e.preventDefault()
    addField(newFieldPath, newFieldName, newFieldType)
  }

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
  }, [data, updateData, getDefaultValue])

  const renderField = (val, path, key, isArrayItem = false, depth = 0) => {
    const type = getType(val)
    const isExpandable = type === 'object' || type === 'array'
    const isExpanded = expanded[path] !== false
    const isEmpty = isExpandable && Object.keys(val).length === 0

    return (
      <div key={path} className="group">
        <div className={`flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary/50 transition-colors ${depth > 0 ? 'ml-3' : ''}`}>
          {/* Expand/Collapse */}
          {isExpandable && (
            <button
              onClick={() => toggleExpand(path)}
              className="p-0.5 text-gray-500 hover:text-accent transition-colors flex-shrink-0"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!isExpandable && <div className="w-4 flex-shrink-0" />}

          {/* Key */}
          {!isArrayItem && (
            <input
              type="text"
              className="w-32 bg-bg-card border border-border rounded px-2.5 py-1.5 text-sm text-red-400 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono flex-shrink-0"
              value={key}
              onChange={(e) => {
                // Rename functionality can be added here
              }}
              placeholder="key"
            />
          )}

          {/* Colon */}
          {!isArrayItem && <span className="text-gray-500 flex-shrink-0">:</span>}

          {/* Value Input */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            {type === 'string' && (
              <input
                type="text"
                className="w-full min-w-[200px] bg-bg-card border border-border rounded px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                value={val}
                onChange={(e) => updateValue(path, e.target.value)}
                placeholder="Enter text..."
              />
            )}

            {type === 'number' && (
              <input
                type="number"
                className="w-full min-w-[120px] bg-bg-card border border-border rounded px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                value={val}
                onChange={(e) => updateValue(path, parseFloat(e.target.value) || 0)}
              />
            )}

            {type === 'boolean' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                    val
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-bg-card text-gray-400 border border-border hover:border-gray-500'
                  }`}
                  onClick={() => updateValue(path, true)}
                >
                  true
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                    !val
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-bg-card text-gray-400 border border-border hover:border-gray-500'
                  }`}
                  onClick={() => updateValue(path, false)}
                >
                  false
                </button>
              </div>
            )}

            {type === 'null' && (
              <span className="text-purple-400 text-sm italic px-2 py-1">null</span>
            )}

            {isExpandable && (
              <span className={`text-xs ${type === 'object' ? 'text-blue-400' : 'text-yellow-400'}`}>
                {type === 'object' ? `{${Object.keys(val).length}}` : `[${val.length}]`}
              </span>
            )}
          </div>

          {/* Type Selector */}
          <select
            className="bg-bg-card border border-border rounded px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-accent cursor-pointer capitalize flex-shrink-0"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Bool</option>
            <option value="null">Null</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {/* Delete Button */}
          <button
            onClick={() => deleteField(path)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            title="Delete field"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Add Field Inline Form */}
        {type === 'object' && isExpanded && (
          <div className="ml-7 mt-1.5 mb-2">
            {newFieldPath === path ? (
              <form onSubmit={handleAddFieldSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-32 bg-bg-card border border-accent rounded px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-accent font-mono"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  autoFocus
                />
                <select
                  className="bg-bg-card border border-accent rounded px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-accent cursor-pointer capitalize"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Bool</option>
                  <option value="null">Null</option>
                  <option value="object">Object</option>
                  <option value="array">Array</option>
                </select>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg bg-accent hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={cancelAddField}
                  className="px-2.5 py-1.5 rounded-lg bg-bg-card hover:bg-border text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => showAddField(path)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-accent hover:bg-accent/10 transition-colors text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add field
              </button>
            )}
          </div>
        )}

        {/* Nested Fields */}
        {isExpandable && !isEmpty && isExpanded && (
          <div className="mt-1 space-y-0.5">
            {Object.entries(val).map(([k, v], index) => (
              renderField(v, `${path}.${k}`, k, Array.isArray(val), depth + 1)
            ))}
          </div>
        )}

        {/* Empty State */}
        {isExpandable && isEmpty && isExpanded && (
          <div className="ml-7 mt-1 text-gray-500 text-xs italic">
            {type === 'object' ? 'Empty object' : 'Empty array'}
          </div>
        )}
      </div>
    )
  }

  const handleAddRootField = () => {
    showAddField('root')
  }

  const isArray = Array.isArray(data)
  const fieldCount = isArray ? data.length : Object.keys(data).length

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isArray ? 'text-yellow-400' : 'text-blue-400'}`}>
            {isArray ? `[${fieldCount}]` : `{${fieldCount}}`}
          </span>
          <span className="text-xs text-gray-500">
            {isArray ? 'Array' : 'Object'}
          </span>
        </div>
        {!isArray && (
          <button
            onClick={handleAddRootField}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent hover:bg-blue-600 text-white text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        )}
      </div>

      {/* Fields Container - Scrollable */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px] space-y-1">
          {fieldCount === 0 ? (
            <div className="text-center py-6">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-gray-400 text-xs mb-2">No fields yet</p>
              {!isArray && (
                <button
                  onClick={handleAddRootField}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                >
                  + Add First Field
                </button>
              )}
            </div>
          ) : (
            Object.entries(data).map(([key, val]) =>
              renderField(val, `root.${key}`, key, isArray)
            )
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-gray-500">
        <span>Fields: {fieldCount}</span>
        <span>Size: {JSON.stringify(data).length} bytes</span>
      </div>
    </div>
  )
}
