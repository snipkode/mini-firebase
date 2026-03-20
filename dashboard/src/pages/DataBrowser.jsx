import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './DataBrowser.css'

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
    const commonCollections = ['users', 'posts', 'items', 'data', 'documents']
    const found = []
    
    for (const col of commonCollections) {
      try {
        const res = await fetch(`${API_URL}/api/${projectId}/db/${col}`, {
          headers: { 'x-api-key': key }
        })
        if (res.ok) {
          found.push(col)
        }
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
    if (!confirm('Delete?')) return
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

  if (loading) {
    return (
      <div className="data-browser">
        <div className="loading-state"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="data-browser">
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate(-1)}>←</button>
          <h1>Data</h1>
        </div>
        <button
          className={`btn-icon ${compactMode ? 'active' : ''}`}
          onClick={() => setCompactMode(!compactMode)}
          title="Toggle compact"
        >
          ⧉
        </button>
      </header>

      <div className="container">
        <div className="project-info-card">
          <div className="project-icon">🚀</div>
          <div className="project-details">
            <h2>{project?.name}</h2>
            <p className="project-id">{projectId.slice(0, 12)}...</p>
          </div>
        </div>

        <div className="toolbar">
          <select
            className="input input-sm"
            value={selectedCollection}
            onChange={(e) => {
              setSelectedCollection(e.target.value)
              fetchData(apiKey, e.target.value)
            }}
          >
            <option value="">Select...</option>
            {collections.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddDoc(true)}
            disabled={!selectedCollection}
          >
            + Add
          </button>
        </div>

        {!selectedCollection ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>Select a collection</p>
          </div>
        ) : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <p>No documents</p>
          </div>
        ) : (
          <div className={`data-list ${compactMode ? 'compact' : ''}`}>
            {data.map((doc) => (
              <div key={doc.id} className="data-card">
                <div className="data-header">
                  <span className="doc-id" onClick={() => navigator.clipboard.writeText(doc.id)}>
                    📄 {doc.id?.slice(0, 10)}...
                  </span>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(doc.id)}
                  >
                    🗑
                  </button>
                </div>
                <pre className="data-content">
                  {JSON.stringify(doc, null, compactMode ? null : 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddDoc && (
        <div className="modal-overlay" onClick={() => setShowAddDoc(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Document</h2>
            <form onSubmit={handleAddDoc}>
              <div className="form-group">
                <label className="label">JSON</label>
                <textarea
                  className="input"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  placeholder='{"name": "Example"}'
                  rows={6}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddDoc(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
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
