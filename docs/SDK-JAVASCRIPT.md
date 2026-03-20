# 📦 Mini Firebase JavaScript SDK

Dokumentasi lengkap untuk Mini Firebase JavaScript Client SDK.

---

## 📋 Daftar Isi

1. [Instalasi](#instalasi)
2. [Inisialisasi](#inisialisasi)
3. [Authentication](#authentication)
4. [Collections & Documents](#collections--documents)
5. [Realtime Updates](#realtime-updates)
6. [Multi-Tenant Projects](#multi-tenant-projects)
7. [Advanced Queries](#advanced-queries)
8. [Error Handling](#error-handling)
9. [Contoh Lengkap](#contoh-lengkap)

---

## 📦 Instalasi

### Via NPM
```bash
npm install mini-firebase-sdk
```

### Via CDN
```html
<script src="https://cdn.jsdelivr.net/npm/mini-firebase-sdk/dist/index.min.js"></script>
```

### Manual
Download dari repo GitHub dan include di project:
```html
<script src="./sdk/index.js"></script>
```

---

## 🚀 Inisialisasi

### Basic Setup
```javascript
import MiniFirebase from 'mini-firebase-sdk'

// Inisialisasi dengan default config
const db = new MiniFirebase()

// Atau dengan custom config
const db = new MiniFirebase({
  httpUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3001'
})

// Connect to WebSocket (optional untuk realtime)
await db.connect()
```

### Browser (Vanilla JS)
```html
<script type="module">
  import MiniFirebase from './sdk/index.js'
  
  const db = new MiniFirebase()
  await db.connect()
</script>
```

---

## 🔐 Authentication

### Register User Baru
```javascript
const result = await db.register('user@example.com', 'password123')

if (result.success) {
  console.log('Registered:', result.user)
  console.log('Token:', result.token)
} else {
  console.error('Registration failed:', result.error)
}
```

### Login
```javascript
const result = await db.login('user@example.com', 'password123')

if (result.token) {
  console.log('Logged in as:', result.user.email)
  // Token otomatis disimpan untuk request selanjutnya
}
```

### Logout
```javascript
await db.logout()
console.log('Logged out')
```

### Cek User yang Login
```javascript
const user = await db.getCurrentUser()
if (user) {
  console.log('Current user:', user.email)
} else {
  console.log('Not logged in')
}
```

### Manual Set Token
```javascript
// Jika token disimpan di localStorage
const token = localStorage.getItem('auth_token')
db.setToken(token)
```

---

## 📁 Collections & Documents

### Akses Collection
```javascript
const users = db.collection('users')
const posts = db.collection('posts')
```

### Add Document
```javascript
// Auto-generate ID
const doc = await users.add({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  active: true
})

console.log('Created document with ID:', doc.id)
```

### Get All Documents
```javascript
const allUsers = await users.get()
console.log('All users:', allUsers)
// Output: [{ id: '...', name: 'John', ... }, ...]
```

### Get Single Document by ID
```javascript
// Query dengan filter
const activeUsers = await users.get({ 
  field: 'status', 
  value: 'active' 
})
```

### Update Document
```javascript
const updated = await users.update('document_id_here', {
  name: 'Jane Doe',
  age: 31
})

console.log('Updated:', updated)
```

### Delete Document
```javascript
await users.delete('document_id_here')
console.log('Document deleted')
```

---

## 🔄 Realtime Updates

### Subscribe to Collection Changes
```javascript
// Setup listener
const unsubscribe = await users.onSnapshot((data) => {
  console.log('Realtime update:', data)
  // data = array of all documents in collection
})

// Later, to stop listening:
unsubscribe()
```

### Multiple Listeners
```javascript
// Bisa subscribe ke multiple collections
const unsubUsers = await users.onSnapshot(data => {
  console.log('Users changed:', data)
})

const unsubPosts = await posts.onSnapshot(data => {
  console.log('Posts changed:', data)
})

// Unsubscribe semua
unsubUsers()
unsubPosts()
```

---

## 🏢 Multi-Tenant Projects

### Create Project
```javascript
// Harus login dulu
await db.login('admin@example.com', 'password')

const project = await db.createProject(
  'My Production App',
  'Production environment'
)

console.log('Project created:', project.project)
console.log('API Key:', project.apiKey)
```

### Set Active Project
```javascript
// Gunakan API key untuk akses project
db.setProject(projectId, apiKey)

// Sekarang semua operasi akan menggunakan project ini
const users = db.collection('users')
await users.add({ name: 'Project User' })
```

### List Projects
```javascript
const projects = await db.getProjects()
console.log('My projects:', projects.projects)
```

---

## 🔍 Advanced Queries

### Simple Query
```javascript
// Filter single field
const activeUsers = await users.get({
  field: 'status',
  value: 'active'
})
```

### Advanced Query (POST)
```javascript
const results = await users.queryAdvanced({
  where: {
    status: 'active',
    age: 25
  },
  sortBy: 'name',
  order: 'asc',
  limit: 10,
  offset: 0
})

console.log('Query results:', results)
```

### Query Operators

**Where (Multiple Fields):**
```javascript
{
  where: {
    status: 'active',
    role: 'admin'
  }
}
```

**Sort:**
```javascript
{
  sortBy: 'created_at',
  order: 'desc' // atau 'asc'
}
```

**Pagination:**
```javascript
{
  limit: 20,
  offset: 40 // page 3 (0-indexed)
}
```

---

## ❌ Error Handling

### Try-Catch Pattern
```javascript
try {
  const doc = await users.add({ name: 'Test' })
  console.log('Success:', doc)
} catch (error) {
  console.error('Error:', error.message)
  
  // Handle specific errors
  if (error.message.includes('Authorization')) {
    // Redirect to login
  }
}
```

### Check Response
```javascript
const result = await db.login('user', 'wrong')

if (result.error) {
  console.error('Login failed:', result.error)
} else {
  console.log('Success!')
}
```

---

## 💡 Contoh Lengkap

### Full App Example
```javascript
import MiniFirebase from 'mini-firebase-sdk'

class MyApp {
  constructor() {
    this.db = new MiniFirebase('http://localhost:3000')
    this.users = null
  }

  async init() {
    // Connect to WebSocket
    await this.db.connect()
    
    // Login or register
    try {
      await this.db.login('user@example.com', 'password123')
    } catch (err) {
      await this.db.register('user@example.com', 'password123')
    }
    
    // Setup collection
    this.users = this.db.collection('users')
    
    // Setup realtime listener
    await this.users.onSnapshot((data) => {
      this.renderUsers(data)
    })
    
    // Load initial data
    await this.loadUsers()
  }

  async loadUsers() {
    try {
      const users = await this.users.get()
      this.renderUsers(users)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  async addUser(name, email) {
    try {
      await this.users.add({ name, email, createdAt: new Date().toISOString() })
    } catch (err) {
      console.error('Failed to add user:', err)
    }
  }

  async deleteUser(id) {
    if (!confirm('Delete this user?')) return
    try {
      await this.users.delete(id)
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  renderUsers(users) {
    const container = document.getElementById('users-list')
    container.innerHTML = users.map(user => `
      <div class="user-card">
        <span>${user.name} (${user.email})</span>
        <button onclick="app.deleteUser('${user.id}')">Delete</button>
      </div>
    `).join('')
  }
}

// Start app
const app = new MyApp()
app.init()
```

### React Integration
```javascript
import { useEffect, useState } from 'react'
import MiniFirebase from 'mini-firebase-sdk'

const db = new MiniFirebase()

function UsersComponent() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function setup() {
      await db.connect()
      
      const users = db.collection('users')
      
      // Initial load
      const data = await users.get()
      setUsers(data)
      setLoading(false)
      
      // Realtime updates
      const unsubscribe = await users.onSnapshot(setUsers)
      
      return () => unsubscribe()
    }
    
    setup()
  }, [])

  const addUser = async (name) => {
    await db.collection('users').add({ name, createdAt: Date.now() })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => addUser('New User')}>Add User</button>
    </div>
  )
}
```

### Vue Integration
```javascript
import { ref, onMounted, onUnmounted } from 'vue'
import MiniFirebase from 'mini-firebase-sdk'

const db = new MiniFirebase()

export default {
  setup() {
    const users = ref([])
    const unsubscribe = ref(null)

    onMounted(async () => {
      await db.connect()
      const usersCollection = db.collection('users')
      
      users.value = await usersCollection.get()
      
      unsubscribe.value = await usersCollection.onSnapshot((data) => {
        users.value = data
      })
    })

    onUnmounted(() => {
      if (unsubscribe.value) unsubscribe.value()
    })

    const addUser = async (name) => {
      await db.collection('users').add({ name })
    }

    return { users, addUser }
  }
}
```

---

## 📊 API Reference

### MiniFirebase Class

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor` | `options: { httpUrl, wsUrl }` | - | Create new instance |
| `connect` | - | `Promise` | Connect to WebSocket |
| `disconnect` | - | - | Disconnect WebSocket |
| `register` | `email, password` | `Promise<{user, token}>` | Register new user |
| `login` | `email, password` | `Promise<{user, token}>` | Login user |
| `logout` | - | `Promise` | Logout current user |
| `getCurrentUser` | - | `Promise<{user}>` | Get current user |
| `setToken` | `token: string` | - | Set auth token manually |
| `collection` | `name: string` | `Collection` | Get collection reference |
| `createProject` | `name, description` | `Promise<{project, apiKey}>` | Create new project |
| `getProjects` | - | `Promise<{projects}>` | List all projects |
| `setProject` | `projectId, apiKey` | - | Set active project |

### Collection Class

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `add` | `data: object` | `Promise<{id, ...data}>` | Add document |
| `get` | `query?: {field, value}` | `Promise<Array>` | Get documents |
| `update` | `id, data: object` | `Promise<document>` | Update document |
| `delete` | `id: string` | `Promise` | Delete document |
| `queryAdvanced` | `options: object` | `Promise<Array>` | Advanced query |
| `onSnapshot` | `callback: function` | `Promise<unsubscribe>` | Realtime listener |

---

## 🔧 Configuration Options

### Environment Variables
```javascript
// .env
VITE_MINI_FIREBASE_URL=http://localhost:3000
VITE_MINI_FIREBASE_WS_URL=ws://localhost:3001
```

### Usage
```javascript
const db = new MiniFirebase({
  httpUrl: import.meta.env.VITE_MINI_FIREBASE_URL,
  wsUrl: import.meta.env.VITE_MINI_FIREBASE_WS_URL
})
```

---

## 📝 Best Practices

### 1. Reuse Instance
```javascript
// ❌ BAD - Create new instance every time
function getData() {
  const db = new MiniFirebase()
  return db.collection('users').get()
}

// ✅ GOOD - Singleton pattern
const db = new MiniFirebase()
function getData() {
  return db.collection('users').get()
}
```

### 2. Cleanup Listeners
```javascript
useEffect(() => {
  const unsubscribe = await db.collection('users').onSnapshot(setUsers)
  return () => unsubscribe() // Cleanup on unmount
}, [])
```

### 3. Handle Errors
```javascript
try {
  await db.collection('users').add(data)
} catch (error) {
  // Show user-friendly error
  showError(error.message)
}
```

### 4. Store Token Securely
```javascript
// Save token after login
localStorage.setItem('mf_token', result.token)

// Restore on app start
const token = localStorage.getItem('mf_token')
if (token) db.setToken(token)
```

---

## 🐛 Troubleshooting

### "Authorization required"
**Solusi:** Login dulu atau set token manual
```javascript
await db.login(email, password)
// atau
db.setToken(savedToken)
```

### "WebSocket not connected"
**Solusi:** Pastikan call `connect()` dulu
```javascript
await db.connect()
```

### "Document not found"
**Solusi:** Cek ID document benar
```javascript
const doc = await collection.get({ field: 'id', value: docId })
```

---

## 📞 Support

- GitHub Issues: https://github.com/snipkode/mini-firebase/issues
- Documentation: /docs
- Dashboard: http://localhost:3000

---

**Mini Firebase SDK - Build apps faster**
