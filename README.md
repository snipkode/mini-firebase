# 🔥 Mini Firebase

**Backend-as-a-Service (BaaS)** ringan dengan database NoSQL, API otomatis, dan realtime update.

---

## 🚀 Fitur

- ✅ Database NoSQL (file-based)
- ✅ REST API otomatis
- ✅ Realtime update via WebSocket
- ✅ Client SDK (JavaScript)
- ✅ C++ database engine
- ✅ Authentication (Register/Login)
- ✅ Update & Delete documents
- ✅ Multi-tenant support (Projects)
- ✅ API Keys management
- ✅ Advanced queries (sort, limit, where)
- ✅ Web Dashboard

---

## 📦 Struktur Project

```
mini-firebase/
├── cpp-engine/     # C++ database engine
├── api/            # Node.js API layer
├── sdk/            # JavaScript client SDK
├── data/           # Database storage
└── docs/           # Documentation
```

---

## 🛠️ Installation

### 1. Build C++ Engine

```bash
cd cpp-engine
make
```

### 2. Install API Dependencies

```bash
cd api
npm install
```

---

## 🚀 Usage

### Start Server

```bash
cd api
npm start
```

Server akan berjalan di:
- REST API: `http://localhost:3000`
- WebSocket: `ws://localhost:3001`

---

## 📖 API Reference

### REST API

#### Core API
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/db/:collection` | Insert document |
| GET | `/db/:collection` | Get all documents |
| GET | `/db/:collection/query?field=X&value=Y` | Query documents |
| PUT | `/db/:collection/:id` | Update document |
| DELETE | `/db/:collection/:id` | Delete document |

#### Authentication
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user |

#### Multi-tenant (Projects)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/projects` | Create project |
| GET | `/projects` | List user projects |
| GET | `/projects/:id` | Get project details |
| DELETE | `/projects/:id` | Delete project |
| POST | `/projects/:id/api-keys` | Create API key |
| DELETE | `/projects/:id/api-keys/:key` | Revoke API key |

#### Project Database (API Key auth)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/:projectId/db/:collection` | Insert document |
| GET | `/api/:projectId/db/:collection` | Get all documents |
| POST | `/api/:projectId/db/:collection/query` | Advanced query |
| PUT | `/api/:projectId/db/:collection/:id` | Update document |
| DELETE | `/api/:projectId/db/:collection/:id` | Delete document |

#### Dashboard
| Endpoint | Deskripsi |
|--------|-----------|
| GET `/` | Web Dashboard UI |

### Contoh Request

**Insert Data:**
```bash
curl -X POST http://localhost:3000/db/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alam","status":"aktif"}'
```

**Get Data:**
```bash
curl http://localhost:3000/db/users
```

**Query Data:**
```bash
curl "http://localhost:3000/db/users/query?field=status&value=aktif"
```

**Update Data:**
```bash
curl -X PUT http://localhost:3000/db/users/1234567890_1234 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Alam Updated","status":"inactive"}'
```

**Delete Data:**
```bash
curl -X DELETE http://localhost:3000/db/users/1234567890_1234 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Register User:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

**Login User:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

**Advanced Query:**
```bash
curl -X POST http://localhost:3000/api/PROJECT_ID/db/users/query \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"where":{"status":"active"},"sortBy":"name","order":"asc","limit":10}'
```

**Create Project:**
```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My App","description":"My awesome project"}'
```

---

## 💻 Client SDK

### Browser

```html
<script src="sdk/index.js"></script>
<script>
  const db = new MiniFirebase();
  await db.connect();

  // Register/Login
  await db.register('user@example.com', 'password123');
  
  // Create project
  const project = await db.createProject('My App', 'Description');
  
  // Set project for multi-tenant usage
  db.setProject(project.project.id, project.apiKey);

  const users = db.collection('users');

  // Add data
  const doc = await users.add({ name: 'Alam', status: 'aktif' });
  console.log('Added:', doc);

  // Get data
  const all = await users.get();
  console.log('Users:', all);

  // Update data
  await users.update(doc.id, { status: 'inactive' });

  // Delete data
  await users.delete(doc.id);

  // Advanced query
  const results = await users.queryAdvanced({
    where: { status: 'active' },
    sortBy: 'name',
    order: 'asc',
    limit: 10
  });

  // Realtime updates
  const unsubscribe = await users.onSnapshot(data => {
    console.log('Realtime update:', data);
  });
</script>
```

### Node.js

```javascript
const MiniFirebase = require('./sdk');

const db = new MiniFirebase();
await db.connect();

// Auth
await db.register('user@example.com', 'password123');
// or
await db.login('user@example.com', 'password123');

const users = db.collection('users');

// Add
const doc = await users.add({ name: 'Alam', status: 'aktif' });

// Get
const all = await users.get();

// Query
const active = await users.get({ field: 'status', value: 'aktif' });

// Update
await users.update(doc.id, { status: 'inactive' });

// Delete
await users.delete(doc.id);

// Realtime
const unsubscribe = await users.onSnapshot(data => {
  console.log('Update:', data);
});

// Logout
await db.logout();
```

---

## 🧪 Testing

### Test C++ Engine

```bash
cd cpp-engine
./db-cli init
./db-cli insert users '{"name":"Alam","status":"aktif"}'
./db-cli get users
```

### Test API

```bash
# Health check
curl http://localhost:3000/health

# Insert
curl -X POST http://localhost:3000/db/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","status":"active"}'

# Get all
curl http://localhost:3000/db/users
```

---

## 📊 Data Model

Document format:
```json
{
  "id": "1234567890_1234",
  "name": "Alam",
  "status": "aktif"
}
```

---

## ⚙️ Configuration

| Env Var | Default | Deskripsi |
|---------|---------|-----------|
| PORT | 3000 | REST API port |
| WS_PORT | 3001 | WebSocket port |

---

## 📝 Roadmap

### Phase 1 (✅ Completed)
- [x] Database C++
- [x] REST API
- [x] Realtime WebSocket
- [x] Client SDK

### Phase 2 (✅ Completed)
- [x] Update/Delete API
- [x] Authentication
- [x] SDK updates

### Phase 3 (✅ Completed)
- [x] Multi-tenant support
- [x] Dashboard UI
- [x] Advanced queries

---

## ⚠️ Limitations

- Single node only (MVP)
- File-based storage (no distributed system)
- Basic security (no auth in Phase 1)

---

## 📄 License

MIT

---

## 👨‍💻 Author

Mini Firebase Team

---

> **Mini Firebase = Engine + API + Realtime + SDK**
