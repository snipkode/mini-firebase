import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = isLogin ? await login(email, password) : await register(email, password)

    setLoading(false)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-bg-primary to-bg-secondary">
      <div className="w-full max-w-sm bg-bg-secondary rounded-xl border border-border p-6">
        <div className="text-center text-2xl font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent mb-5">
          🔥 Mini Firebase
        </div>
        
        <h1 className="text-xl text-center mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-gray-400 text-center text-xs mb-5">
          {isLogin ? 'Sign in to continue' : 'Get started with your account'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-2.5 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <input
              type="password"
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-accent hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-5 text-xs text-gray-400">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="ml-1 text-accent hover:underline font-medium bg-transparent border-none cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
