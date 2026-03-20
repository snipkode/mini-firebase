import { useState, useEffect } from 'react'

export default function JsonTreeInput({ value, onChange }) {
  const [data, setData] = useState(() => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      setData(parsed)
    } catch {}
  }, [value])

  const updateData = (newData) => {
    setData(newData)
    onChange(JSON.stringify(newData, null, 2))
  }

  const getType = (val) => {
    if (val === null) return 'null'
    if (Array.isArray(val)) return 'array'
    return typeof val
  }

  const addField = (path, newKey, type = 'string') => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path ? path.split('.').slice(1) : []
    let current = newData
    
    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {}
      }
      current = current[key]
    }
    
    const defaultValues = {
      string: '',
      number: 0,
      boolean: false,
      null: null,
      object: {},
      array: []
    }
    
    if (Array.isArray(current)) {
      current.push(defaultValues[type])
    } else {
      current[newKey] = defaultValues[type]
    }
    
    updateData(newData)
  }

  const deleteField = (path) => {
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
  }

  const updateValue = (path, newValue) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    
    let current = newData
    for (const key of keys.slice(0, -1)) {
      current = current[key]
    }
    
    const lastKey = keys[keys.length - 1]
    current[lastKey] = newValue
    updateData(newData)
  }

  const changeType = (path, newType) => {
    const newData = JSON.parse(JSON.stringify(data))
    const keys = path.split('.').slice(1)
    
    let current = newData
    for (const key of keys.slice(0, -1)) {
      current = current[key]
    }
    
    const lastKey = keys[keys.length - 1]
    const defaultValues = {
      string: '',
      number: 0,
      boolean: false,
      null: null,
      object: {},
      array: []
    }
    
    current[lastKey] = defaultValues[newType]
    updateData(newData)
  }

  const renderField = (val, path, key, isArrayItem = false) => {
    const type = getType(val)
    const isExpandable = type === 'object' || type === 'array'
    const displayKey = isArrayItem ? `[${key}]` : `"${key}"`

    return (
      <div key={path} className="group">
        <div className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-bg-secondary -mx-2">
          {/* Expand/Collapse for objects/arrays */}
          {isExpandable && (
            <span className="text-gray-500 text-xs w-4">▼</span>
          )}
          {!isExpandable && <span className="w-4" />}

          {/* Key */}
          {!isArrayItem && (
            <span className="text-red-400 text-xs font-medium">"{key}"</span>
          )}
          {!isArrayItem && <span className="text-gray-400 text-xs">:</span>}

          {/* Value Editor based on type */}
          {type === 'string' && (
            <input
              type="text"
              className="flex-1 bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 outline-none focus:border-accent min-w-0"
              value={val}
              onChange={(e) => updateValue(path, e.target.value)}
              placeholder="Enter text..."
            />
          )}

          {type === 'number' && (
            <input
              type="number"
              className="flex-1 bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 outline-none focus:border-accent min-w-0 w-24"
              value={val}
              onChange={(e) => updateValue(path, parseFloat(e.target.value) || 0)}
            />
          )}

          {type === 'boolean' && (
            <select
              className="bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-orange-400 outline-none focus:border-accent cursor-pointer"
              value={val.toString()}
              onChange={(e) => updateValue(path, e.target.value === 'true')}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          )}

          {type === 'null' && (
            <span className="text-purple-400 text-xs italic">null</span>
          )}

          {type === 'object' && (
            <span className="text-blue-400 text-xs">
              {'{'} {Object.keys(val).length} keys {'}'}
            </span>
          )}

          {type === 'array' && (
            <span className="text-yellow-400 text-xs">
              [{' '}
              {val.length} items
              {']'}
            </span>
          )}

          {/* Type Selector */}
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="null">null</option>
            <option value="object">object</option>
            <option value="array">array</option>
          </select>

          {/* Delete Button */}
          <button
            onClick={() => deleteField(path)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete field"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Render nested fields */}
        {isExpandable && Object.keys(val).length > 0 && (
          <div className="ml-4 border-l border-border pl-2 mt-1">
            {Object.entries(val).map(([k, v], index) => (
              <div key={k}>
                {renderField(v, `${path}.${k}`, k, Array.isArray(val))}
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
    
    const type = prompt('Enter type (string/number/boolean/null/object/array):', 'string')
    addField('', newKey, type || 'string')
  }

  return (
    <div className="font-mono text-sm">
      {/* Root Add Button */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <span className="text-xs text-gray-400">
          {Array.isArray(data) ? `Array (${data.length} items)` : `Object (${Object.keys(data).length} fields)`}
        </span>
        {!Array.isArray(data) && (
          <button
            onClick={handleAddRootField}
            className="flex items-center gap-1 text-xs text-accent hover:text-blue-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        )}
      </div>

      {/* Root Content */}
      {Array.isArray(data) ? (
        <div className="text-yellow-400 text-xs mb-2">[ {data.length} items ]</div>
      ) : (
        <div className="text-blue-400 text-xs mb-2">{'{'} {Object.keys(data).length} keys {'}'}</div>
      )}

      {/* Fields */}
      <div className="space-y-0.5">
        {Object.entries(data).map(([key, val]) => renderField(val, `root.${key}`, key, Array.isArray(data)))}
      </div>
    </div>
  )
}
