import { useState, useCallback } from 'react'

export default function JsonTreeInput({ value, onChange }) {
  const [expanded, setExpanded] = useState({})

  const data = useState(() => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value
    } catch {
      return {}
    }
  })[0]

  const updateData = useCallback((newData) => {
    onChange(JSON.stringify(newData, null, 2))
  }, [onChange])

  const getType = (val) => {
    if (val === null) return 'null'
    if (Array.isArray(val)) return 'array'
    return typeof val
  }

  const getDefaultValue = (type) => {
    switch (type) {
      case 'string': return ''
      case 'number': return 0
      case 'boolean': return false
      case 'null': return null
      case 'object': return {}
      case 'array': return []
      default: return ''
    }
  }

  const addField = useCallback((path, newKey, type = 'string') => {
    if (!newKey) return
    
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path ? path.split('.').slice(1) : []
    let current = newData
    
    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {}
      }
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
    for (const key of keys) {
      current = current[key]
    }
    
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
    for (const key of keys.slice(0, -1)) {
      current = current[key]
    }
    
    const lastKey = keys[keys.length - 1]
    current[lastKey] = newValue
    updateData(newData)
  }, [data, updateData])

  const changeType = useCallback((path, newType) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    
    let current = newData
    for (const key of keys.slice(0, -1)) {
      current = current[key]
    }
    
    const lastKey = keys[keys.length - 1]
    current[lastKey] = getDefaultValue(newType)
    updateData(newData)
  }, [data, updateData])

  const toggleExpand = useCallback((path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }, [])

  const renderField = (val, path, key, isArrayItem = false, depth = 0) => {
    const type = getType(val)
    const isExpandable = type === 'object' || type === 'array'
    const isExpanded = expanded[path]
    const isEmpty = isExpandable && Object.keys(val).length === 0
    const displayKey = isArrayItem ? `[${key}]` : `"${key}"`

    return (
      <div key={path} className="group">
        <div 
          className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-bg-secondary -mx-2 cursor-pointer"
          onClick={(e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
              if (isExpandable) toggleExpand(path)
            }
          }}
        >
          {/* Expand/Collapse */}
          {isExpandable && !isEmpty && (
            <span className="text-gray-500 text-xs w-4 flex-shrink-0">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!isExpandable && <span className="w-4 flex-shrink-0" />}

          {/* Key */}
          {!isArrayItem && (
            <span className="text-red-400 text-xs font-medium flex-shrink-0">"{key}"</span>
          )}
          {!isArrayItem && <span className="text-gray-400 text-xs flex-shrink-0">:</span>}

          {/* Value based on type */}
          {type === 'string' && (
            <input
              type="text"
              className="flex-1 min-w-0 bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 outline-none focus:border-accent"
              value={val}
              onChange={(e) => updateValue(path, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter text..."
            />
          )}

          {type === 'number' && (
            <input
              type="number"
              className="flex-1 bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 outline-none focus:border-accent w-24 flex-shrink-0"
              value={val}
              onChange={(e) => updateValue(path, parseFloat(e.target.value) || 0)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {type === 'boolean' && (
            <select
              className="bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-orange-400 outline-none focus:border-accent cursor-pointer flex-shrink-0"
              value={val.toString()}
              onChange={(e) => updateValue(path, e.target.value === 'true')}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          )}

          {type === 'null' && (
            <span className="text-purple-400 text-xs italic flex-shrink-0">null</span>
          )}

          {type === 'object' && (
            <span className="text-blue-400 text-xs flex-shrink-0">
              {'{'} {isEmpty ? 'empty' : `${Object.keys(val)} keys`} {'}'}
            </span>
          )}

          {type === 'array' && (
            <span className="text-yellow-400 text-xs flex-shrink-0">
              [{' '}
              {isEmpty ? 'empty' : `${val.length} items`}
              {']'}
            </span>
          )}

          {/* Type Selector */}
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize flex-shrink-0"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">bool</option>
            <option value="null">null</option>
            <option value="object">obj</option>
            <option value="array">array</option>
          </select>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteField(path)
            }}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Delete field"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add Field Button for Objects */}
        {type === 'object' && isExpanded && !isEmpty && (
          <div className="ml-6 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newKey = prompt('Enter field name:')
                if (newKey) addField(path, newKey, 'string')
              }}
              className="flex items-center gap-1 text-xs text-accent hover:text-blue-400 transition-colors py-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add field
            </button>
          </div>
        )}

        {/* Nested Fields */}
        {isExpandable && isExpanded && !isEmpty && (
          <div className="ml-4 border-l border-border pl-3 mt-1 space-y-0.5">
            {Object.entries(val).map(([k, v], index) => (
              <div key={k}>
                {renderField(v, `${path}.${k}`, k, Array.isArray(val), depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleAddRootField = () => {
    const newKey = prompt('Enter field name:')
    if (!newKey) return
    addField('', newKey, 'string')
  }

  const isArray = Array.isArray(data)
  const fieldCount = isArray ? data.length : Object.keys(data).length

  return (
    <div className="font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <span className="text-xs text-gray-400">
          {isArray ? `Array (${fieldCount} items)` : `Object (${fieldCount} fields)`}
        </span>
        {!isArray && (
          <button
            onClick={handleAddRootField}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        )}
      </div>

      {/* Root Type Indicator */}
      <div className={`text-xs mb-3 ${isArray ? 'text-yellow-400' : 'text-blue-400'}`}>
        {isArray ? `[ ${fieldCount} items ]` : `{ ${fieldCount} keys }`}
      </div>

      {/* Fields */}
      <div className="space-y-0.5">
        {fieldCount === 0 ? (
          <div className="text-gray-500 text-xs italic py-4 text-center">
            No fields yet. Click "Add Field" to create one.
          </div>
        ) : (
          Object.entries(data).map(([key, val]) => 
            renderField(val, `root.${key}`, key, isArray)
          )
        )}
      </div>
    </div>
  )
}
