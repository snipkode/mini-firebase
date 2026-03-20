import { useState } from 'react'

export default function JsonTreeInput({ value, onChange }) {
  const [data, setData] = useState(() => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value
    } catch {
      return {}
    }
  })

  const updateData = (newData) => {
    setData(newData)
    onChange(JSON.stringify(newData, null, 2))
  }

  const addField = (path, newKey, newValue = '') => {
    const newData = JSON.parse(JSON.stringify(data))
    
    if (!path || path === 'root') {
      newData[newKey] = newValue
    } else {
      const keys = path.split('.').slice(1)
      let current = newData
      for (const key of keys) {
        current = current[key]
      }
      if (Array.isArray(current)) {
        current.push(newValue)
      } else {
        current[newKey] = newValue
      }
    }
    
    updateData(newData)
  }

  const deleteField = (path, key) => {
    const newData = JSON.parse(JSON.stringify(data))
    
    if (!path || path === 'root') {
      delete newData[key]
    } else {
      const keys = path.split('.').slice(1)
      let current = newData
      for (const k of keys) {
        current = current[k]
      }
      if (Array.isArray(current)) {
        current.splice(parseInt(key), 1)
      } else {
        delete current[key]
      }
    }
    
    updateData(newData)
  }

  const updateValue = (path, key, newValue) => {
    const newData = JSON.parse(JSON.stringify(data))
    
    if (!path || path === 'root') {
      newData[key] = newValue
    } else {
      const keys = path.split('.').slice(1)
      let current = newData
      for (const k of keys) {
        current = current[k]
      }
      current[key] = newValue
    }
    
    updateData(newData)
  }

  const renderField = (val, path, key, isArrayItem = false) => {
    const isObject = val !== null && typeof val === 'object'
    const isArray = Array.isArray(val)
    const isEmpty = isObject && Object.keys(val).length === 0
    const displayKey = isArrayItem ? `[${key}]` : key

    if (val === null) {
      return (
        <div key={path} className="flex items-center gap-2 py-1 hover:bg-bg-secondary rounded px-2 -mx-2 group">
          <span className="text-red-400 text-xs">{isArrayItem ? '' : `"${key}"`}</span>
          {!isArrayItem && <span className="text-gray-400">:</span>}
          <select
            className="bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-purple-400 outline-none focus:border-accent"
            value="null"
            onChange={(e) => updateValue(path, key, null)}
          >
            <option value="null">null</option>
          </select>
          <button
            onClick={() => deleteField(path, key)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    if (typeof val === 'boolean') {
      return (
        <div key={path} className="flex items-center gap-2 py-1 hover:bg-bg-secondary rounded px-2 -mx-2 group">
          <span className="text-red-400 text-xs">{isArrayItem ? '' : `"${key}"`}</span>
          {!isArrayItem && <span className="text-gray-400">:</span>}
          <select
            className="bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-orange-400 outline-none focus:border-accent"
            value={val.toString()}
            onChange={(e) => updateValue(path, key, e.target.value === 'true')}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
          <button
            onClick={() => deleteField(path, key)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    if (typeof val === 'number') {
      return (
        <div key={path} className="flex items-center gap-2 py-1 hover:bg-bg-secondary rounded px-2 -mx-2 group">
          <span className="text-red-400 text-xs">{isArrayItem ? '' : `"${key}"`}</span>
          {!isArrayItem && <span className="text-gray-400">:</span>}
          <input
            type="number"
            className="bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 w-24 outline-none focus:border-accent"
            value={val}
            onChange={(e) => updateValue(path, key, parseFloat(e.target.value) || 0)}
          />
          <button
            onClick={() => deleteField(path, key)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    if (typeof val === 'string') {
      return (
        <div key={path} className="flex items-center gap-2 py-1 hover:bg-bg-secondary rounded px-2 -mx-2 group">
          <span className="text-red-400 text-xs">{isArrayItem ? '' : `"${key}"`}</span>
          {!isArrayItem && <span className="text-gray-400">:</span>}
          <input
            type="text"
            className="bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 w-48 outline-none focus:border-accent"
            value={val}
            onChange={(e) => updateValue(path, key, e.target.value)}
          />
          <button
            onClick={() => deleteField(path, key)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    return null
  }

  const renderObject = (obj, path, key, isArray = false) => {
    const keys = Object.keys(obj)
    const isEmpty = keys.length === 0
    const displayKey = isArray ? `[${key}]` : key

    return (
      <div key={path} className="ml-2">
        <div className="flex items-center gap-2 py-1">
          <span className="text-red-400 text-xs">{isArray ? '' : `"${key}"`}</span>
          {!isArray && <span className="text-gray-400">:</span>}
          <span className="text-blue-400 text-xs">{isArray ? '[' : '{'}</span>
          {isEmpty && <span className="text-gray-500 text-xs">empty</span>}
          {!isEmpty && (
            <span className="text-gray-400 text-xs">{keys.length} {isArray ? 'items' : 'keys'}</span>
          )}
          <span className="text-blue-400 text-xs">{isArray ? ']' : '}'}</span>
          {!isArray && (
            <button
              onClick={() => addField(path, prompt('Field name:') || '', '')}
              className="p-1 text-gray-400 hover:text-accent transition-colors"
              title="Add field"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        {!isEmpty && (
          <div className="border-l border-border ml-2 pl-2">
            {keys.map((k, index) => (
              <div key={k}>
                {renderField(obj[k], `${path}.${k}`, k, isArray)}
                {typeof obj[k] === 'object' && obj[k] !== null && renderObject(obj[k], `${path}.${k}`, k, Array.isArray(obj[k]))}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {typeof data === 'object' && data !== null 
        ? renderObject(data, 'root', 'root', Array.isArray(data))
        : renderField(data, 'root', 'root')
      }
    </div>
  )
}
