import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import JsonTreeInput from '../components/JsonTreeInput'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import InputDialog from '../components/InputDialog'

const API_URL = ''

function syntaxHighlight(json) {
  if (!json) return ''
  
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'text-green-400' // number
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-red-400' // key
      } else {
        cls = 'text-green-400' // string
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-orange-400' // boolean
    } else if (/null/.test(match)) {
      cls = 'text-purple-400' // null
    }
    return `<span class="${cls}">${match}</span>`
  })
}

export default function DataBrowser() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [project, setProject] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [compactMode, setCompactMode] = useState(true)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [newDoc, setNewDoc] = useState('{}')
  const [newCollection, setNewCollection] = useState('')
  const [viewMode, setViewMode] = useState('table')
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'info' })
  const [inputDialog, setInputDialog] = useState({ isOpen: false, title: '', label: '', placeholder: '', onConfirm: null, type: 'text' })

  useEffect(() => {
    fetchProject()
  }, [projectId])

  async function fetchProject() {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.project) {
        setProject(data.project)
        const key = data.project.apiKeys?.[0]?.key
        setApiKey(key)
        if (key) {
          fetchCollections(key)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCollections(key) {
    // Only fetch from a predefined list of common collections
    const commonCollections = ['users', 'posts', 'products', 'orders']
    const found = []
    
    for (const col of commonCollections) {
      try {
        const res = await fetch(`${API_URL}/api/${projectId}/db/${col}`, {
          headers: { 'x-api-key': key }
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            found.push({ name: col, count: data.length })
          }
        }
      } catch (err) {}
    }
    
    setCollections(found)
    if (found.length > 0 && !selectedCollection) {
      setSelectedCollection(found[0].name)
      fetchData(key, found[0].name)
    }
  }

  async function fetchData(key, collection) {
    if (!collection) return
    try {
      const res = await fetch(`${API_URL}/api/${projectId}/db/${collection}`, {
        headers: { 'x-api-key': key }
      })
      const data = await res.json()
      setData(data || [])
    } catch (err) {
      console.error(err)
      setData([])
    }
  }

  function handleCreateCollectionClick() {
    setInputDialog({
      isOpen: true,
      title: 'Create Collection',
      label: 'Collection Name',
      placeholder: 'e.g., users, products, orders',
      type: 'text',
      onConfirm: async (name) => {
        try {
          const res = await fetch(`${API_URL}/api/${projectId}/db/${name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({ _created: new Date().toISOString() })
          })
          if (res.ok) {
            fetchCollections(apiKey)
          }
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  function handleDeleteCollection(collection) {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Collection',
      message: `Are you sure you want to delete "${collection}"? All documents will be permanently deleted.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/api/${projectId}/db/${collection}`, {
            headers: { 'x-api-key': apiKey }
          })
          const docs = await res.json()
          
          for (const doc of docs) {
            await fetch(`${API_URL}/api/${projectId}/db/${collection}/${doc.id}`, {
              method: 'DELETE',
              headers: { 'x-api-key': apiKey }
            })
          }
          
          fetchCollections(apiKey)
          if (selectedCollection === collection) {
            setSelectedCollection('')
            setData([])
          }
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  async function handleAddDoc(e) {
    e.preventDefault()
    try {
      const doc = JSON.parse(newDoc)
      const res = await fetch(`${API_URL}/api/${projectId}/db/${selectedCollection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(doc)
      })
      if (res.ok) {
        setShowAddDoc(false)
        setNewDoc('{}')
        fetchData(apiKey, selectedCollection)
      }
    } catch (err) {
      alert('Invalid JSON')
    }
  }

  function handleDeleteDoc(id) {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/api/${projectId}/db/${selectedCollection}/${id}`, {
            method: 'DELETE',
            headers: { 'x-api-key': apiKey }
          })
          fetchData(apiKey, selectedCollection)
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  function handleEditDoc(doc) {
    setInputDialog({
      isOpen: true,
      title: 'Edit Document',
      label: 'JSON Data',
      placeholder: '{"name": "Example"}',
      type: 'textarea',
      onConfirm: async (updatedJson) => {
        try {
          const updatedDoc = JSON.parse(updatedJson)
          await fetch(`${API_URL}/api/${projectId}/db/${selectedCollection}/${doc.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(updatedDoc)
          })
          fetchData(apiKey, selectedCollection)
        } catch (err) {
          alert('Invalid JSON')
        }
      }
    })
  }

  const getDocFields = (doc) => {
    return Object.keys(doc).filter(k => k !== 'id' && k !== '_created')
  }

  const allFields = [...new Set(data.flatMap(getDocFields))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-secondary border-b border-border px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-bg-card transition-colors" onClick={() => navigate(-1)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Collections</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-bg-card'}`}
            onClick={() => setViewMode('table')}
            title="Table view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'json' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-bg-card'}`}
            onClick={() => setViewMode('json')}
            title="JSON view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button
            className={`p-1.5 rounded-lg transition-colors ${compactMode ? 'bg-accent text-white' : 'text-gray-400 hover:bg-bg-card'}`}
            onClick={() => setCompactMode(!compactMode)}
            title="Toggle compact"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-3">
        {/* Project Info */}
        <div className="bg-bg-secondary border border-border rounded-xl p-3 mb-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-bg-card rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            🚀
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-truncate">{project?.name}</h2>
            <p className="text-[10px] text-gray-400 font-mono">{projectId.slice(0, 16)}...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-2.5 border-b border-border flex items-center justify-between">
                <h2 className="text-xs font-semibold text-gray-300">Collections</h2>
                <button
                  className="p-1 rounded hover:bg-bg-card text-accent"
                  onClick={handleCreateCollectionClick}
                  title="Create collection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                {collections.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    No collections
                  </div>
                ) : (
                  collections.map((col) => (
                    <div
                      key={col.name}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        selectedCollection === col.name 
                          ? 'bg-accent/10 border-l-2 border-accent' 
                          : 'hover:bg-bg-card border-l-2 border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedCollection(col.name)
                        fetchData(apiKey, col.name)
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">📊</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-truncate">{col.name}</div>
                          <div className="text-[10px] text-gray-400">{col.count} docs</div>
                        </div>
                      </div>
                      <button
                        className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCollection(col.name)
                        }}
                        title="Delete collection"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-3">
            {!selectedCollection ? (
              <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-sm">Select a collection</p>
              </div>
            ) : data.length === 0 ? (
              <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-gray-400 text-sm mb-3">No documents in {selectedCollection}</p>
                <button
                  className="bg-accent hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setShowAddDoc(true)}
                >
                  + Add Document
                </button>
              </div>
            ) : (
              <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                {/* Table Header Actions */}
                <div className="bg-bg-card border-b border-border px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {selectedCollection} ({data.length} docs)
                    </span>
                  </div>
                  <button
                    className="bg-accent hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    onClick={() => setShowAddDoc(true)}
                  >
                    + Add
                  </button>
                </div>

                {viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-bg-card border-b border-border">
                        <tr>
                          {allFields.slice(0, compactMode ? 4 : allFields.length).map((field) => (
                            <th
                              key={field}
                              className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium whitespace-nowrap"
                            >
                              {field}
                            </th>
                          ))}
                          <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((doc) => (
                          <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-bg-card/30 transition-colors group">
                            {allFields.slice(0, compactMode ? 4 : allFields.length).map((field) => (
                              <td key={field} className="px-3 py-2.5 max-w-[120px]">
                                <div className="text-xs text-truncate">
                                  {typeof doc[field] === 'object'
                                    ? JSON.stringify(doc[field])
                                    : String(doc[field] ?? '-')}
                                </div>
                              </td>
                            ))}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  className="p-1.5 rounded text-gray-400 hover:bg-bg-card hover:text-accent transition-colors"
                                  onClick={() => handleEditDoc(doc)}
                                  title="Edit"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  className="p-1.5 rounded text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  title="Delete"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto scrollbar-thin p-3 space-y-3">
                    {data.map((doc, index) => (
                      <div key={doc.id} className="bg-bg-card border border-border rounded-lg overflow-hidden">
                        <div className="bg-bg-secondary border-b border-border px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-mono">#{index + 1}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{doc.id?.slice(0, 16)}...</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1.5 rounded text-gray-400 hover:bg-bg-secondary hover:text-accent transition-colors"
                              onClick={() => handleEditDoc(doc)}
                              title="Edit document"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="p-1.5 rounded text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              onClick={() => handleDeleteDoc(doc.id)}
                              title="Delete document"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-3 overflow-x-auto bg-[#0d1117]">
                          <pre className="text-xs font-mono leading-relaxed">
                            <code dangerouslySetInnerHTML={{ 
                              __html: syntaxHighlight(JSON.stringify(doc, null, 2)) 
                            }} />
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Document Modal */}
      <Modal
        isOpen={showAddDoc}
        onClose={() => setShowAddDoc(false)}
        title="Add Document"
        size="lg"
      >
        <form onSubmit={handleAddDoc}>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Document Fields</label>
            <div className="bg-bg-card border border-border rounded-lg p-3 max-h-[400px] overflow-y-auto scrollbar-thin">
              <JsonTreeInput 
                value={newDoc} 
                onChange={setNewDoc}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="flex-1 bg-bg-card hover:bg-border text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors" onClick={() => setShowAddDoc(false)}>
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-accent hover:bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">
              Add Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      {/* Input Dialog */}
      <InputDialog
        isOpen={inputDialog.isOpen}
        onClose={() => setInputDialog({ ...inputDialog, isOpen: false })}
        onConfirm={inputDialog.onConfirm}
        title={inputDialog.title}
        label={inputDialog.label}
        placeholder={inputDialog.placeholder}
        type={inputDialog.type}
      />
    </div>
  )
}
