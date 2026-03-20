import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const API_URL = ''

export default function Dashboard() {
  const { user, logout, token } = useAuth()
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({ projects: 0, collections: 0, apiKeys: 0 })
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const projs = data.projects || []
      setProjects(projs)
      setStats({
        projects: projs.length,
        collections: projs.length * 3,
        apiKeys: projs.reduce((sum, p) => sum + (p.apiKeys?.length || 0), 0)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div className="logo">🔥 Mini Firebase</div>
        <div className="header-actions">
          <button className="btn-icon" onClick={() => setShowMenu(!showMenu)}>
            ☰
          </button>
        </div>
      </header>

      {showMenu && (
        <div className="mobile-menu">
          <Link to="/projects" onClick={() => setShowMenu(false)}>Projects</Link>
          <Link to="/settings" onClick={() => setShowMenu(false)}>Settings</Link>
          <button onClick={() => { logout(); setShowMenu(false); }}>Logout</button>
        </div>
      )}

      <div className="container">
        <div className="welcome-card">
          <div>
            <h1>Welcome, {user?.email?.split('@')[0]}!</h1>
            <p>Manage your projects and data</p>
          </div>
          <Link to="/projects" className="btn btn-primary">+ New Project</Link>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-info">
              <div className="stat-value">{stats.projects}</div>
              <div className="stat-label">Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.collections}</div>
              <div className="stat-label">Collections</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔑</div>
            <div className="stat-info">
              <div className="stat-value">{stats.apiKeys}</div>
              <div className="stat-label">API Keys</div>
            </div>
          </div>
        </div>

        <section className="section">
          <div className="section-header">
            <h2>Recent Projects</h2>
            <Link to="/projects" className="link">View All</Link>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : projects.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>No projects yet</p>
              <Link to="/projects" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Create Project
              </Link>
            </div>
          ) : (
            <div className="projects-list">
              {projects.slice(0, 3).map((project) => (
                <Link
                  key={project.id}
                  to={`/data/${project.id}`}
                  className="project-card-mini"
                >
                  <div className="project-icon">🚀</div>
                  <div className="project-info">
                    <div className="project-name">{project.name}</div>
                    <div className="project-meta">
                      {project.apiKeys?.length || 0} API keys
                    </div>
                  </div>
                  <div className="chevron">›</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/projects" className="action-card">
              <span className="action-icon">📁</span>
              <span>Manage Projects</span>
            </Link>
            <a href="/api" target="_blank" className="action-card">
              <span className="action-icon">🔌</span>
              <span>API Docs</span>
            </a>
            <Link to="/settings" className="action-card">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
