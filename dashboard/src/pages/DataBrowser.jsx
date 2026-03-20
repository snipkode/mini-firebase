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
  const [newDoc, setNewDoc] = useState('{}')

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
        if (key) fetchCollections(key)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCollections(key) {
    const commonCollections = ['users', 'posts', 'items', 'data', 'documents']
    const found = []
    for (const col of commonCollections) {
      try {
        const res = await fetch(`${API_URL}/api/${projectId}/db/${col}`, {
          headers: { 'x-api-key': key }
        })
        if (res.ok) found.push(col)
      } catch (err) {}
    }
    setCollections(found)
    if (found.length > 0 && !selectedCollection) {
      setSelectedCollection(found[0])
      fetchData(key, found[0])
    }
  }

  async function fetchData(key, collection) {
    if (!collection) return
    try {
      const res = await fetch(`${API_URL}/api/${projectId}/db/${collection}`, {
        headers: { 'x-api-key': key }
      })
      const data = await res.json()
      setData(data)
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

  async function handleDelete(id) {
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

  const getDocFields = (doc) => {
    return Object.keys(doc).filter(k => k !== 'id')
  }

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
          <h1 className="text-lg font-semibold">Data Browser</h1>
        </div>
        <button
          className={`p-1.5 rounded-lg transition-colors ${compactMode ? 'bg-accent text-white' : 'text-gray-400 hover:bg-bg-card'}`}
          onClick={() => setCompactMode(!compactMode)}
          title="Toggle compact"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
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

        {/* Toolbar */}
        <div className="flex gap-2 mb-4">
          <select
            className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
            value={selectedCollection}
            onChange={(e) => {
              setSelectedCollection(e.target.value)
              fetchData(apiKey, e.target.value)
            }}
          >
            <option value="">Select collection...</option>
            {collections.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <button
            className="bg-accent hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            onClick={() => setShowAddDoc(true)}
            disabled={!selectedCollection}
          >
            + Add
          </button>
        </div>

        {/* Data Table */}
        {!selectedCollection ? (
          <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-gray-400 text-sm">Select a collection</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-gray-400 text-sm">No documents</p>
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-card border-b border-border">
                  <tr>
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium w-10">ID</th>
                    {getDocFields(data[0]).slice(0, compactMode ? 3 : 5).map((field) => (
                      <th key={field} className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium whitespace-nowrap">
                        {field}
                      </th>
                    ))}
                    <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((doc) => (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-bg-card/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <span 
                          className="text-[10px] bg-bg-card px-1.5 py-0.5 rounded text-gray-400 cursor-pointer hover:text-accent"
                          onClick={() => navigator.clipboard.writeText(doc.id)}
                          title={doc.id}
                        >
                          {doc.id?.slice(0, 8)}...
                        </span>
                      </td>
                      {getDocFields(doc).slice(0, compactMode ? 3 : 5).map((field) => (
                        <td key={field} className="px-3 py-2.5 max-w-[150px]">
                          <div className="text-xs text-truncate">
                            {typeof doc[field] === 'object' ? JSON.stringify(doc[field]) : String(doc[field] ?? '-')}
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right">
                        <button 
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          onClick={() => handleDelete(doc.id)}
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 5 && (
              <div className="bg-bg-card border-t border-border px-3 py-2 text-center">
                <span className="text-[10px] text-gray-400">{data.length} documents total</span>
              </div>
            )}
          </div>
        )}
      </div>

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
