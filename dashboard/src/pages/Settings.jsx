import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

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
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-3">
        {/* Account */}
        <section className="mb-4">
          <h2 className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">Account</h2>
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
              <div className="w-9 h-9 bg-bg-card rounded-lg flex items-center justify-center text-lg">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400 uppercase">Email</div>
                <div className="text-sm text-truncate">{user?.email}</div>
              </div>
            </div>
          </div>
        </section>

        {/* App */}
        <section className="mb-4">
          <h2 className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">App</h2>
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
              <div className="w-9 h-9 bg-bg-card rounded-lg flex items-center justify-center text-lg">
                🎨
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 uppercase">Theme</div>
                <div className="text-sm">Dark</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="w-9 h-9 bg-bg-card rounded-lg flex items-center justify-center text-lg">
                📱
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 uppercase">Mode</div>
                <div className="text-sm">Compact</div>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mb-4">
          <h2 className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">About</h2>
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
              <div className="w-9 h-9 bg-bg-card rounded-lg flex items-center justify-center text-lg">
                🔥
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 uppercase">Mini Firebase</div>
                <div className="text-sm">v1.0.0</div>
              </div>
            </div>
            <a 
              href="https://github.com/snipkode/mini-firebase" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-3 hover:bg-bg-card/50 transition-colors"
            >
              <div className="w-9 h-9 bg-bg-card rounded-lg flex items-center justify-center text-lg">
                📄
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 uppercase">Documentation</div>
                <div className="text-sm text-accent">View Docs →</div>
              </div>
            </a>
          </div>
        </section>

        {/* Logout */}
        <button 
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          onClick={logout}
        >
          Sign Out
        </button>

        <p className="text-center text-[10px] text-gray-500 mt-6">
          Built with React + Tailwind
        </p>
      </div>
    </div>
  )
}
