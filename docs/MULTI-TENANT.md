# 🏢 Multi-Tenant Guide

Panduan lengkap menggunakan fitur multi-tenant di Mini Firebase.

---

## 📋 Daftar Isi

1. [Konsep Multi-Tenant](#konsep-multi-tenant)
2. [Arsitektur](#arsitektur)
3. [Langkah-langkah Setup](#langkah-langkah-setup)
4. [API Reference](#api-reference)
5. [Contoh Penggunaan](#contoh-penggunaan)
6. [Best Practices](#best-practices)

---

## 📚 Konsep Multi-Tenant

Multi-tenant memungkinkan Anda membuat **beberapa project terpisah** dalam satu akun Mini Firebase. Setiap project memiliki:

- **Database terpisah** - Data tidak tercampur antar project
- **API Key unik** - Setiap project punya kunci akses sendiri
- **Isolated storage** - File storage terpisah per project

### Use Cases

- **SaaS Application** - Satu aplikasi untuk banyak customer
- **Development Stages** - Separate dev, staging, production
- **Multiple Apps** - Kelola banyak aplikasi dalam satu dashboard

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Mini Firebase                         │
├─────────────────────────────────────────────────────────┤
│  User Account (email/password)                          │
│  └── Project A (ID: abc123)                             │
│      ├── API Key: mf_xxx...                             │
│      └── Data: /data/projects/abc123/                   │
│          ├── users.json                                 │
│          └── posts.json                                 │
│  └── Project B (ID: def456)                             │
│      ├── API Key: mf_yyy...                             │
│      └── Data: /data/projects/def456/                   │
│          ├── users.json                                 │
│          └── orders.json                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Langkah-langkah Setup

### Step 1: Register/Login

```bash
# Register akun baru
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"developer@company.com","password":"secure123"}'

# Response:
{
  "user": {
    "id": "usr_123456",
    "email": "developer@company.com"
  },
  "token": "eyJhbGc..."
}
```

Simpan **token** untuk request selanjutnya.

---

### Step 2: Buat Project

```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Production App",
    "description": "Production environment for customer-facing app"
  }'

# Response:
{
  "project": {
    "id": "cd1253529e111a29e3824108d2ee5ad2",
    "ownerId": "usr_123456",
    "name": "My Production App",
    "description": "Production environment...",
    "createdAt": "2026-03-20T00:00:00.000Z",
    "apiKeys": [
      {
        "key": "mf_e132dd296b26ddf91654488426495f6c5510e9451ec7b8cf",
        "name": "Default Key",
        "createdAt": "2026-03-20T00:00:00.000Z"
      }
    ]
  },
  "apiKey": "mf_e132dd296b26ddf91654488426495f6c5510e9451ec7b8cf"
}
```

**PENTING:** Simpan:
- **Project ID**: `cd1253529e111a29e3824108d2ee5ad2`
- **API Key**: `mf_e132dd296b26ddf91654488426495f6c5510e9451ec7b8cf`

---

### Step 3: Gunakan Project Database

Sekarang Anda bisa mengakses database project dengan API Key:

```bash
# Insert data
curl -X POST http://localhost:3000/api/PROJECT_ID/db/users \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get data
curl http://localhost:3000/api/PROJECT_ID/db/users \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 📖 API Reference

### Authentication Endpoints

#### POST `/auth/register`
Register user baru.

```json
// Request
{
  "email": "user@example.com",
  "password": "min6karakter"
}

// Response
{
  "user": { "id": "...", "email": "user@example.com" },
  "token": "..."
}
```

#### POST `/auth/login`
Login user.

```json
// Request
{
  "email": "user@example.com",
  "password": "password"
}

// Response
{
  "user": { "id": "...", "email": "user@example.com" },
  "token": "..."
}
```

---

### Project Management Endpoints

#### POST `/projects`
Buat project baru.

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Body:**
```json
{
  "name": "Project Name",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "project": {
    "id": "...",
    "name": "Project Name",
    "apiKeys": [{"key": "mf_...", "name": "Default Key"}]
  },
  "apiKey": "mf_..."
}
```

---

#### GET `/projects`
List semua project milik user.

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Response:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "Project A",
      "description": "...",
      "apiKeys": [...]
    }
  ]
}
```

---

#### GET `/projects/:projectId`
Detail project tertentu.

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Response:**
```json
{
  "project": {
    "id": "...",
    "name": "...",
    "description": "...",
    "createdAt": "...",
    "apiKeys": [
      {"key": "mf_...", "name": "Default Key", "createdAt": "..."}
    ]
  }
}
```

---

#### POST `/projects/:projectId/api-keys`
Buat API key baru untuk project.

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Body:**
```json
{
  "name": "Production Key"
}
```

**Response:**
```json
{
  "key": "mf_newkey...",
  "keyObj": {
    "key": "mf_newkey...",
    "name": "Production Key",
    "createdAt": "..."
  }
}
```

---

#### DELETE `/projects/:projectId/api-keys/:apiKey`
Revoke/hapus API key.

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Response:**
```json
{
  "success": true
}
```

---

#### DELETE `/projects/:projectId`
Hapus project.

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Response:**
```json
{
  "success": true
}
```

---

### Project Database Endpoints

Gunakan **API Key** untuk akses database project.

#### POST `/api/:projectId/db/:collection`
Insert document.

**Headers:**
- `x-api-key: YOUR_API_KEY`

**Body:** Document JSON

**Response:**
```json
{
  "id": "timestamp_random",
  "...data"
}
```

---

#### GET `/api/:projectId/db/:collection`
Get semua documents.

**Headers:**
- `x-api-key: YOUR_API_KEY`

**Response:** Array of documents

---

#### GET `/api/:projectId/db/:collection/query?field=X&value=Y`
Query sederhana.

**Headers:**
- `x-api-key: YOUR_API_KEY`

**Response:** Filtered array

---

#### POST `/api/:projectId/db/:collection/query`
Advanced query.

**Headers:**
- `x-api-key: YOUR_API_KEY`
- `Content-Type: application/json`

**Body:**
```json
{
  "where": {"status": "active", "age": {"$gt": 18}},
  "sortBy": "name",
  "order": "asc",
  "limit": 10,
  "offset": 0
}
```

**Response:** Filtered & sorted array

---

#### PUT `/api/:projectId/db/:collection/:id`
Update document.

**Headers:**
- `x-api-key: YOUR_API_KEY`

**Body:** Updated fields

**Response:** Updated document

---

#### DELETE `/api/:projectId/db/:collection/:id`
Delete document.

**Headers:**
- `x-api-key: YOUR_API_KEY`

**Response:**
```json
{
  "success": true,
  "id": "..."
}
```

---

## 💡 Contoh Penggunaan

### 1. Setup Multi-Environment

```bash
# Development Project
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Dev Environment","description":"Development"}'

# Staging Project
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Staging Environment","description":"Testing"}'

# Production Project
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Production Environment","description":"Live"}'
```

---

### 2. Menggunakan SDK (Client-side)

```javascript
const MiniFirebase = require('mini-firebase-sdk');

const db = new MiniFirebase('http://localhost:3000');

// 1. Login
await db.login('developer@company.com', 'password123');

// 2. Create project (jika belum ada)
const project = await db.createProject('My App', 'Production');

// 3. Set project untuk digunakan
db.setProject(project.project.id, project.apiKey);

// 4. Sekarang bisa akses database project
const users = db.collection('users');

// Insert
const user = await users.add({
  name: 'John Doe',
  email: 'john@example.com'
});

// Get all
const allUsers = await users.get();

// Advanced query
const activeUsers = await users.queryAdvanced({
  where: { status: 'active' },
  sortBy: 'name',
  order: 'asc',
  limit: 10
});

// Update
await users.update(user.id, { status: 'inactive' });

// Delete
await users.delete(user.id);
```

---

### 3. SaaS - Multiple Customers

```javascript
// Server-side (Node.js)

const projects = {
  customerA: { id: 'abc123', apiKey: 'mf_keyA...' },
  customerB: { id: 'def456', apiKey: 'mf_keyB...' }
};

// Function to get customer DB
function getCustomerDB(customerId) {
  const project = projects[customerId];
  const db = new MiniFirebase();
  db.setProject(project.id, project.apiKey);
  return db;
}

// Usage
const customerADB = getCustomerDB('customerA');
const orders = customerADB.collection('orders');
await orders.add({ product: 'Widget', quantity: 10 });
```

---

### 4. Dashboard Web

Akses dashboard di browser: **http://localhost:3000**

1. **Login** dengan email/password
2. **Create Project** - Klik "+ New Project"
3. **View Project** - Lihat detail dan API keys
4. **Copy API Key** - Untuk digunakan di aplikasi
5. **Data Browser** - Lihat data collections

---

## 🔒 Best Practices

### Security

1. **Jangan expose API Key di client code**
   ```javascript
   // ❌ BAD - API key terekspos
   const API_KEY = 'mf_secret...';
   
   // ✅ GOOD - Gunakan backend proxy
   app.post('/api/data', async (req, res) => {
     const response = await fetch('...', {
       headers: { 'x-api-key': process.env.API_KEY }
     });
   });
   ```

2. **Rotate API Key secara berkala**
   ```bash
   # Buat key baru
   curl -X POST /projects/:id/api-keys -d '{"name":"New Key"}'
   
   # Revoke key lama
   curl -X DELETE /projects/:id/api-keys/OLD_KEY
   ```

3. **Gunakan environment variables**
   ```bash
   # .env
   MINI_FIREBASE_PROJECT_ID=abc123
   MINI_FIREBASE_API_KEY=mf_xxx...
   ```

---

### Organization

1. **Naming Convention**
   ```
   - myapp-development
   - myapp-staging
   - myapp-production
   - customer-{id}-db
   ```

2. **API Key Naming**
   ```
   - Development Key
   - Production Key
   - CI/CD Key
   - Backup Key
   ```

3. **Document Your Projects**
   ```json
   {
     "name": "E-commerce Production",
     "description": "Main production DB for e-commerce platform. Handles orders, users, inventory."
   }
   ```

---

### Performance

1. **Collection Organization**
   ```
   users/
   orders/
   products/
   inventory/
   ```

2. **Query Optimization**
   ```javascript
   // ✅ GOOD - Specific query
   await db.queryAdvanced({
     where: { status: 'active' },
     limit: 50
   });
   
   // ❌ BAD - Load all data
   const all = await db.get();
   const filtered = all.filter(x => x.status === 'active');
   ```

---

## 🐛 Troubleshooting

### Error: "API key required"
**Solusi:** Tambahkan header `x-api-key` di request.

### Error: "Invalid API key"
**Solusi:** Pastikan API key benar dan belum di-revoke.

### Error: "Project not found"
**Solusi:** Cek Project ID, pastikan project masih ada.

### Error: "Authorization required"
**Solusi:** Tambahkan header `Authorization: Bearer TOKEN`.

---

## 📞 Support

- Documentation: `/docs`
- Dashboard: `http://localhost:3000`
- GitHub: https://github.com/snipkode/mini-firebase

---

**Mini Firebase - Multi-Tenant BaaS**
