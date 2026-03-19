# 🔥 Mini Firebase

**Backend-as-a-Service (BaaS)** ringan dengan database NoSQL, API otomatis, dan realtime update.

---

## 🚀 Fitur

- ✅ Database NoSQL (file-based)
- ✅ REST API otomatis
- ✅ Realtime update via WebSocket
- ✅ Client SDK (JavaScript)
- ✅ C++ database engine

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

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/db/:collection` | Insert document |
| GET | `/db/:collection` | Get all documents |
| GET | `/db/:collection/query?field=X&value=Y` | Query documents |

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

---

## 💻 Client SDK

### Browser

```html
<script src="sdk/index.js"></script>
<script>
  const db = new MiniFirebase();
  db.connect();

  const users = db.collection('users');

  // Add data
  users.add({ name: 'Alam', status: 'aktif' })
    .then(doc => console.log('Added:', doc));

  // Get data
  users.get().then(docs => console.log('Users:', docs));

  // Realtime updates
  users.onSnapshot(data => {
    console.log('Realtime update:', data);
  });
</script>
```

### Node.js

```javascript
const MiniFirebase = require('./sdk');

const db = new MiniFirebase();
db.connect();

const users = db.collection('users');

// Add
const doc = await users.add({ name: 'Alam', status: 'aktif' });

// Get
const all = await users.get();

// Query
const active = await users.get({ field: 'status', value: 'aktif' });

// Realtime
const unsubscribe = await users.onSnapshot(data => {
  console.log('Update:', data);
});
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

### Phase 1 (✅ Current)
- [x] Database C++
- [x] REST API
- [x] Realtime WebSocket
- [x] Client SDK

### Phase 2
- [ ] Update/Delete API
- [ ] Authentication
- [ ] Data validation

### Phase 3
- [ ] Multi-tenant support
- [ ] Dashboard UI
- [ ] Advanced queries

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
