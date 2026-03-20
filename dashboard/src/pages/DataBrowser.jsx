import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = ''

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
  const [viewMode, setViewMode] = useState('table') // table, json

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

  async function handleCreateCollection(e) {
    e.preventDefault()
    if (!newCollection.trim()) return
    
    // Create collection by inserting first document
    try {
      const res = await fetch(`${API_URL}/api/${projectId}/db/${newCollection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ _created: new Date().toISOString() })
      })
      if (res.ok) {
        setShowCreateCollection(false)
        setNewCollection('')
        fetchCollections(apiKey)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteCollection(collection) {
    if (!confirm(`Delete collection "${collection}"? All documents will be deleted.`)) return
    
    try {
      // Delete all documents in collection
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

  async function handleDeleteDoc(id) {
    if (!confirm('Delete this document?')) return
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

  async function handleEditDoc(doc) {
    const updated = prompt('Edit document (JSON):', JSON.stringify(doc, null, 2))
    if (!updated) return
    
    try {
      const updatedDoc = JSON.parse(updated)
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
                  onClick={() => setShowCreateCollection(true)}
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
                        className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
                  <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                    {data.map((doc) => (
                      <div key={doc.id} className="bg-bg-card rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-gray-400 font-mono">{doc.id}</span>
                          <div className="flex gap-1">
                            <button
                              className="p-1 rounded text-gray-400 hover:text-accent"
                              onClick={() => handleEditDoc(doc)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="p-1 rounded text-gray-400 hover:text-red-400"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <pre className="text-[10px] text-gray-400 overflow-x-auto">
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateCollection(false)}>
          <div className="bg-bg-secondary border border-border rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">New Collection</h2>
            <form onSubmit={handleCreateCollection}>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Collection Name</label>
                <input
                  type="text"
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                  placeholder="e.g., users, products"
                  required
                  autoFocus
                  pattern="[a-zA-Z][a-zA-Z0-9_-]*"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 bg-bg-card hover:bg-border text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors" onClick={() => setShowCreateCollection(false)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-accent hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddDoc(false)}>
          <div className="bg-bg-secondary border border-border rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">Add Document</h2>
            <form onSubmit={handleAddDoc}>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">JSON Data</label>
                <textarea
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-accent transition-colors resize-none"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  placeholder='{"name": "Example", "value": 123}'
                  rows={6}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 bg-bg-card hover:bg-border text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors" onClick={() => setShowAddDoc(false)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-accent hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
