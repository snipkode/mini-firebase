import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = ''

export default function Projects() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [copyToast, setCopyToast] = useState(false)

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
    if (!key) return
    await navigator.clipboard.writeText(key)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
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
          <h1 className="text-lg font-semibold">Projects</h1>
        </div>
        <button 
          className="bg-accent hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          onClick={() => setShowModal(true)}
        >
          + New
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-base font-semibold mb-1">No projects</h3>
            <p className="text-gray-400 text-sm mb-4">Create your first project to get started</p>
            <button 
              className="bg-accent hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              onClick={() => setShowModal(true)}
            >
              + Create Project
            </button>
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-card border-b border-border">
                  <tr>
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-4 py-3 font-medium">Project</th>
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-4 py-3 font-medium hidden md:table-cell">Description</th>
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-4 py-3 font-medium hidden sm:table-cell">API Key</th>
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-4 py-3 font-medium">Keys</th>
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide px-4 py-3 font-medium">Status</th>
                    <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-border last:border-0 hover:bg-bg-card/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-bg-card rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                            🚀
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-truncate max-w-[180px]">{project.name}</div>
                            <div className="text-[10px] text-gray-400 md:hidden text-truncate max-w-[150px]">
                              {project.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell max-w-[200px]">
                        <div className="text-truncate">{project.description || '-'}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-[10px] bg-bg-card px-2 py-1 rounded text-gray-400">
                          {project.apiKeys?.[0]?.key?.slice(0, 12)}...
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
                          {project.apiKeys?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-bg-card hover:text-accent transition-colors"
                            onClick={() => copyApiKey(project.apiKeys?.[0]?.key)}
                            title="Copy API key"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button 
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-bg-card hover:text-accent transition-colors"
                            onClick={() => navigate(`/data/${project.id}`)}
                            title="Open data"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-bg-secondary border border-border rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">New Project</h2>
            <form onSubmit={createProject}>
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Name</label>
                <input
                  type="text"
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My App"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description</label>
                <input
                  type="text"
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 bg-bg-card hover:bg-border text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors" onClick={() => setShowModal(false)}>
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

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          ✓ API key copied!
        </div>
      )}
    </div>
  )
}
