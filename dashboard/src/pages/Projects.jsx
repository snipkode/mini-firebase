import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Projects.css'

const API_URL = ''

export default function Projects() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function createProject(e) {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      })
      const data = await res.json()
      if (data.project) {
        setShowModal(false)
        setNewProject({ name: '', description: '' })
        fetchProjects()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function copyApiKey(key) {
    await navigator.clipboard.writeText(key)
    alert('API key copied!')
  }

  return (
    <div className="projects-page">
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate(-1)}>←</button>
          <h1>Projects</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          + New
        </button>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <div className="project-icon">🚀</div>
                  <div className="project-actions">
                    <button
                      className="btn-icon"
                      onClick={() => copyApiKey(project.apiKeys?.[0]?.key)}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <h3>{project.name}</h3>
                <p className="project-desc">{project.description || 'No description'}</p>
                <div className="project-meta">
                  <span className="badge badge-primary">
                    {project.apiKeys?.length || 0} API keys
                  </span>
                  <span className="badge badge-success">Active</span>
                </div>
                <div className="project-api-key">
                  <code>{project.apiKeys?.[0]?.key?.slice(0, 20)}...</code>
                </div>
                <div className="project-footer">
                  <button
                    className="btn btn-secondary btn-sm btn-full"
                    onClick={() => navigate(`/data/${project.id}`)}
                  >
                    Open Data
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Project</h2>
            <form onSubmit={createProject}>
              <div className="form-group">
                <label className="label">Project Name</label>
                <input
                  type="text"
                  className="input"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My Awesome App"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="label">Description (optional)</label>
                <input
                  type="text"
                  className="input"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
