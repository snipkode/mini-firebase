import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="settings-page">
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate(-1)}>←</button>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="container">
        <div className="settings-section">
          <h2>Account</h2>
          <div className="setting-card">
            <div className="setting-icon">👤</div>
            <div className="setting-info">
              <div className="setting-label">Email</div>
              <div className="setting-value">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="setting-card">
            <div className="setting-icon">🎨</div>
            <div className="setting-info">
              <div className="setting-label">Theme</div>
              <div className="setting-value">Dark (Default)</div>
            </div>
          </div>
          <div className="setting-card">
            <div className="setting-icon">📱</div>
            <div className="setting-info">
              <div className="setting-label">Compact Mode</div>
              <div className="setting-value">Enabled</div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>About</h2>
          <div className="setting-card">
            <div className="setting-icon">🔥</div>
            <div className="setting-info">
              <div className="setting-label">Mini Firebase</div>
              <div className="setting-value">v1.0.0</div>
            </div>
          </div>
          <div className="setting-card">
            <div className="setting-icon">📄</div>
            <div className="setting-info">
              <div className="setting-label">Documentation</div>
              <a href="/docs" className="setting-link">View Docs →</a>
            </div>
          </div>
        </div>

        <button className="btn btn-danger btn-full" onClick={logout}>
          Sign Out
        </button>

        <p className="settings-footer">
          Built with React + Vite
        </p>
      </div>
    </div>
  )
}
