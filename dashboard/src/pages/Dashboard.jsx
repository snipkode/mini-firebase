import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
      
      // Count actual collections by checking each project
      let totalCollections = 0
      const commonCollections = ['users', 'posts', 'products', 'orders', 'items', 'data']
      
      for (const project of projs) {
        const apiKey = project.apiKeys?.[0]?.key
        if (apiKey) {
          for (const col of commonCollections) {
            try {
              const res = await fetch(`${API_URL}/api/${project.id}/db/${col}`, {
                headers: { 'x-api-key': apiKey }
              })
              if (res.ok) {
                const colData = await res.json()
                if (Array.isArray(colData) && colData.length > 0) {
                  totalCollections++
                }
              }
            } catch (err) {}
          }
        }
      }
      
      setStats({
        projects: projs.length,
        collections: totalCollections,
        apiKeys: projs.reduce((sum, p) => sum + (p.apiKeys?.length || 0), 0)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-secondary border-b border-border px-3 py-2.5 flex items-center justify-between">
        <div className="text-lg font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
          🔥 Mini Firebase
        </div>
        <button 
          className="p-1.5 rounded-lg text-gray-400 hover:bg-bg-card transition-colors"
          onClick={() => setShowMenu(!showMenu)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
      </header>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="fixed top-11 right-3 bg-bg-card border border-border rounded-xl p-1.5 z-50 min-w-[140px] shadow-xl">
          <Link to="/projects" onClick={() => setShowMenu(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-bg-secondary">
            Projects
          </Link>
          <Link to="/settings" onClick={() => setShowMenu(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-bg-secondary">
            Settings
          </Link>
          <button onClick={() => { logout(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-bg-secondary text-red-400">
            Logout
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-3">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-accent to-purple-600 rounded-xl p-4 mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold mb-0.5">Hi, {user?.email?.split('@')[0]}!</h1>
            <p className="text-xs text-white/80">Manage your projects</p>
          </div>
          <Link to="/projects" className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            + New
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent">{stats.projects}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Projects</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.collections}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Collections</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.apiKeys}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">API Keys</div>
          </div>
        </div>

        {/* Projects Table */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-300">Projects</h2>
            <Link to="/projects" className="text-xs text-accent hover:underline">View All →</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-400 text-sm mb-3">No projects yet</p>
              <Link to="/projects" className="inline-block bg-accent hover:bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                + Create Project
              </Link>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-card border-b border-border">
                    <tr>
                      <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium">Project</th>
                      <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium hidden sm:table-cell">Created</th>
                      <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium">Keys</th>
                      <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide px-3 py-2.5 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 5).map((project) => (
                      <tr key={project.id} className="border-b border-border last:border-0 hover:bg-bg-card/50 transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-bg-card rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                              🚀
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-truncate">{project.name}</div>
                              <div className="text-[10px] text-gray-400 text-truncate max-w-[150px]">
                                {project.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400 hidden sm:table-cell">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
                            {project.apiKeys?.length || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Link 
                            to={`/data/${project.id}`}
                            className="inline-flex items-center gap-1 text-xs text-accent hover:text-blue-400 font-medium transition-colors"
                          >
                            Open
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2">
            <Link to="/projects" className="bg-bg-secondary border border-border rounded-xl p-3 text-center hover:bg-bg-card transition-colors group">
              <div className="text-xl mb-1">📁</div>
              <div className="text-[10px] text-gray-400 group-hover:text-gray-300">Projects</div>
            </Link>
            <Link to="/settings" className="bg-bg-secondary border border-border rounded-xl p-3 text-center hover:bg-bg-card transition-colors group">
              <div className="text-xl mb-1">⚙️</div>
              <div className="text-[10px] text-gray-400 group-hover:text-gray-300">Settings</div>
            </Link>
            <a href="https://github.com/snipkode/mini-firebase" target="_blank" rel="noreferrer" className="bg-bg-secondary border border-border rounded-xl p-3 text-center hover:bg-bg-card transition-colors group">
              <div className="text-xl mb-1">📄</div>
              <div className="text-[10px] text-gray-400 group-hover:text-gray-300">Docs</div>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
