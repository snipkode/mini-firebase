import { useState, useCallback } from 'react'

export default function JsonTreeEditor({ value, onChange, readOnly = false }) {
  const [expanded, setExpanded] = useState({})
  const [newFieldPath, setNewFieldPath] = useState(null)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState('string')

  const parseValue = (val) => {
    try {
      return typeof val === 'string' ? JSON.parse(val) : val
    } catch {
      return {}
    }
  }

  const data = parseValue(value)

  const updateData = useCallback((newData) => {
    onChange(JSON.stringify(newData, null, 2))
  }, [onChange])

  const toggleKey = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

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

    const newData = parseValue(value)
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
  }, [value, updateData, getDefaultValue, parseValue])

  const handleAddFieldSubmit = (e) => {
    e.preventDefault()
    addField(newFieldPath, newFieldName, newFieldType)
  }

  const deleteField = useCallback((path) => {
    const newData = parseValue(value)
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
  }, [value, updateData, parseValue])

  const updateValue = useCallback((path, newValue) => {
    const newData = parseValue(value)
    const keys = path.split('.').slice(1)

    let current = newData
    for (const key of keys.slice(0, -1)) current = current[key]

    const lastKey = keys[keys.length - 1]
    current[lastKey] = newValue
    updateData(newData)
  }, [value, updateData, parseValue])

  const changeType = useCallback((path, newType) => {
    const newData = parseValue(value)
    const keys = path.split('.').slice(1)

    let current = newData
    for (const key of keys.slice(0, -1)) current = current[key]

    const lastKey = keys[keys.length - 1]
    current[lastKey] = getDefaultValue(newType)
    updateData(newData)
  }, [value, updateData, getDefaultValue, parseValue])

  const handleEditKey = (parentPath, key) => {
    if (readOnly) return
    // Inline editing can be implemented similar to CollectionEditor
  }

  const renderValue = (val, path, key, isArrayItem = false, depth = 0) => {
    const type = getType(val)
    const isExpandable = type === 'object' || type === 'array'
    const isExpanded = expanded[path] !== false
    const isEmpty = isExpandable && Object.keys(val).length === 0

    if (val === null) {
      return (
        <div key={path} className="flex items-center gap-2 py-1">
          <span className="text-gray-500 text-xs w-4" />
          <span className="text-red-400 text-xs">"{key}"</span>
          <span className="text-gray-400 text-xs">:</span>
          <span className="text-purple-400 text-sm">null</span>
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">bool</option>
            <option value="null">null</option>
            <option value="object">obj</option>
            <option value="array">array</option>
          </select>
          <button
            onClick={() => deleteField(path)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }

    if (typeof val === 'boolean') {
      return (
        <div key={path} className="flex items-center gap-2 py-1">
          <span className="text-gray-500 text-xs w-4" />
          <span className="text-red-400 text-xs">"{key}"</span>
          <span className="text-gray-400 text-xs">:</span>
          <div className="flex items-center gap-1.5">
            <button
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                val ? 'bg-green-500/20 text-green-400' : 'bg-bg-card text-gray-400'
              }`}
              onClick={() => updateValue(path, true)}
            >
              true
            </button>
            <button
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                !val ? 'bg-red-500/20 text-red-400' : 'bg-bg-card text-gray-400'
              }`}
              onClick={() => updateValue(path, false)}
            >
              false
            </button>
          </div>
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">bool</option>
            <option value="null">null</option>
            <option value="object">obj</option>
            <option value="array">array</option>
          </select>
          <button
            onClick={() => deleteField(path)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }

    if (typeof val === 'number') {
      return (
        <div key={path} className="flex items-center gap-2 py-1">
          <span className="text-gray-500 text-xs w-4" />
          <span className="text-red-400 text-xs">"{key}"</span>
          <span className="text-gray-400 text-xs">:</span>
          <input
            type="number"
            className="flex-1 min-w-[100px] bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 outline-none focus:border-accent"
            value={val}
            onChange={(e) => updateValue(path, parseFloat(e.target.value) || 0)}
          />
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">bool</option>
            <option value="null">null</option>
            <option value="object">obj</option>
            <option value="array">array</option>
          </select>
          <button
            onClick={() => deleteField(path)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }

    if (typeof val === 'string') {
      return (
        <div key={path} className="flex items-center gap-2 py-1">
          <span className="text-gray-500 text-xs w-4" />
          <span className="text-red-400 text-xs">"{key}"</span>
          <span className="text-gray-400 text-xs">:</span>
          <input
            type="text"
            className="flex-1 min-w-[200px] bg-bg-card border border-border rounded px-2 py-0.5 text-xs text-green-400 outline-none focus:border-accent"
            value={val}
            onChange={(e) => updateValue(path, e.target.value)}
            placeholder="Enter text..."
          />
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">bool</option>
            <option value="null">null</option>
            <option value="object">obj</option>
            <option value="array">array</option>
          </select>
          <button
            onClick={() => deleteField(path)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }

    // Object or Array
    const isArray = Array.isArray(val)
    const displayKey = isArrayItem ? `[${key}]` : `"${key}"`

    return (
      <div key={path}>
        <div className="flex items-center gap-2 py-1">
          {isExpandable && (
            <button
              onClick={() => toggleKey(path)}
              className="p-0.5 text-gray-500 hover:text-accent transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!isExpandable && <span className="w-4" />}
          {!isArrayItem && (
            <>
              <span className="text-red-400 text-xs">"{key}"</span>
              <span className="text-gray-400 text-xs">:</span>
            </>
          )}
          <span className={isArray ? 'text-yellow-400' : 'text-blue-400'}>
            {isArray ? '[' : '{'}
          </span>
          {isEmpty ? (
            <span className="text-gray-500 text-xs">empty</span>
          ) : (
            <span className="text-gray-400 text-xs">
              {isArray ? `${val.length} items` : `${Object.keys(val).length} keys`}
            </span>
          )}
          {!isEmpty && isExpandable && (
            <button
              onClick={() => toggleKey(path)}
              className="text-gray-400 hover:text-accent text-xs"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <span className={isArray ? 'text-yellow-400' : 'text-blue-400'}>
            {isArray ? ']' : '}'}
          </span>
          <select
            className="bg-bg-card border border-border rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none focus:border-accent cursor-pointer capitalize"
            value={type}
            onChange={(e) => changeType(path, e.target.value)}
          >
            <option value="string">text</option>
            <option value="number">number</option>
            <option value="boolean">bool</option>
            <option value="null">null</option>
            <option value="object">obj</option>
            <option value="array">array</option>
          </select>
          <button
            onClick={() => deleteField(path)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Add Field Inline Form */}
        {type === 'object' && isExpanded && !isEmpty && (
          <div className="ml-6 mt-1 mb-2">
            {newFieldPath === path ? (
              <form onSubmit={handleAddFieldSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-28 bg-bg-card border border-accent rounded px-2 py-0.5 text-xs text-gray-100 outline-none focus:border-accent font-mono"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  autoFocus
                />
                <select
                  className="bg-bg-card border border-accent rounded px-1.5 py-0.5 text-[10px] text-gray-300 outline-none focus:border-accent cursor-pointer capitalize"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                >
                  <option value="string">text</option>
                  <option value="number">number</option>
                  <option value="boolean">bool</option>
                  <option value="null">null</option>
                </select>
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded bg-accent hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={cancelAddField}
                  className="px-2 py-0.5 rounded bg-bg-card hover:bg-border text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => showAddField(path)}
                className="flex items-center gap-1 text-xs text-accent hover:text-blue-400 transition-colors py-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add field
              </button>
            )}
          </div>
        )}

        {/* Nested Fields */}
        {isExpandable && !isEmpty && isExpanded && (
          <div className="ml-4 border-l border-border pl-3 mt-1 space-y-0.5">
            {Object.entries(val).map(([k, v], index) => (
              renderValue(v, `${path}.${k}`, k, isArray, depth + 1)
            ))}
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

  if (typeof data !== 'object' || data === null) {
    return (
      <div className="font-mono text-sm bg-bg-card rounded-lg p-3 overflow-x-auto">
        {renderValue(data, 'root', 'root')}
      </div>
    )
  }

  return (
    <div className="font-mono text-sm bg-bg-card rounded-lg p-3 overflow-x-auto min-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border">
        <span className={`text-xs font-medium ${isArray ? 'text-yellow-400' : 'text-blue-400'}`}>
          {isArray ? `[${fieldCount} items]` : `{${fieldCount} keys}`}
        </span>
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

      {/* Fields */}
      <div className="min-w-[500px]">
        {fieldCount === 0 ? (
          <div className="text-center py-4">
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
            renderValue(val, `root.${key}`, key, isArray)
          )
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-gray-500">
        <span>Fields: {fieldCount}</span>
        <span>Size: {JSON.stringify(data).length} bytes</span>
      </div>
    </div>
  )
}
