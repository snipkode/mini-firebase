const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.split(' ')[1];
    const user = auth.validateToken(token);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
};

// Database (file-based fallback - works without native dependencies)
const dataDir = '../data';

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function getCollectionPath(collection) {
    return path.join(dataDir, collection + '.json');
}

function generateId() {
    return Date.now() + '_' + Math.floor(Math.random() * 10000);
}

const db = {
    insert: (collection, jsonData) => {
        const docId = generateId();
        const filePath = getCollectionPath(collection);
        let docs = [];
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            docs = JSON.parse(content);
        } catch (e) {
            docs = [];
        }
        
        const newDoc = JSON.parse(jsonData);
        newDoc.id = docId;
        docs.push(newDoc);
        
        fs.writeFileSync(filePath, JSON.stringify(docs));
        return docId;
    },
    get: (collection) => {
        const filePath = getCollectionPath(collection);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.stringify(JSON.parse(content));
        } catch (e) {
            return '[]';
        }
    },
    query: (collection, field, value) => {
        const filePath = getCollectionPath(collection);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const docs = JSON.parse(content);
            const filtered = docs.filter(doc => doc[field] == value);
            return JSON.stringify(filtered);
        } catch (e) {
            return '[]';
        }
    },
    update: (collection, id, updateData) => {
        const filePath = getCollectionPath(collection);
        let docs = [];
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            docs = JSON.parse(content);
        } catch (e) {
            return null;
        }
        
        const docIndex = docs.findIndex(doc => doc.id === id);
        if (docIndex === -1) {
            return null;
        }
        
        docs[docIndex] = { ...docs[docIndex], ...updateData, id };
        fs.writeFileSync(filePath, JSON.stringify(docs));
        return docs[docIndex];
    },
    delete: (collection, id) => {
        const filePath = getCollectionPath(collection);
        let docs = [];
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            docs = JSON.parse(content);
        } catch (e) {
            return false;
        }
        
        const initialLength = docs.length;
        docs = docs.filter(doc => doc.id !== id);
        
        if (docs.length === initialLength) {
            return false;
        }
        
        fs.writeFileSync(filePath, JSON.stringify(docs));
        return true;
    }
};

console.log('✓ Database initialized at', path.resolve(dataDir));

// WebSocket for realtime
const clients = new Map();
let wss;

try {
    wss = new WebSocket.Server({ port: WS_PORT });
    
    wss.on('connection', (ws) => {
        const clientId = Date.now() + '_' + Math.random();
        clients.set(clientId, { ws, subscriptions: new Set() });
        
        ws.on('message', (message) => {
            try {
                const msg = JSON.parse(message);
                
                if (msg.type === 'subscribe') {
                    clients.get(clientId).subscriptions.add(msg.collection);
                    ws.send(JSON.stringify({ type: 'subscribed', collection: msg.collection }));
                }
                
                if (msg.type === 'unsubscribe') {
                    clients.get(clientId).subscriptions.delete(msg.collection);
                }
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: e.message }));
            }
        });
        
        ws.on('close', () => {
            clients.delete(clientId);
        });
        
        console.log(`✓ Client connected: ${clientId}`);
    });
    
    console.log(`✓ WebSocket server running on port ${WS_PORT}`);
} catch (err) {
    console.warn('⚠ WebSocket server failed to start:', err.message);
}

function broadcast(collection, data) {
    if (!wss) return;
    
    const message = JSON.stringify({
        type: 'update',
        collection,
        data: JSON.parse(data)
    });
    
    clients.forEach((client, clientId) => {
        if (client.subscriptions.has(collection) && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
        }
    });
}

// REST API Routes
app.post('/db/:collection', (req, res) => {
    try {
        const { collection } = req.params;
        const jsonData = JSON.stringify(req.body);
        
        const docId = db.insert(collection, jsonData);
        const result = { id: docId, ...req.body };
        
        // Broadcast realtime update
        const allData = db.get(collection);
        broadcast(collection, allData);
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/db/:collection', (req, res) => {
    try {
        const { collection } = req.params;
        const data = db.get(collection);
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/db/:collection/query', (req, res) => {
    try {
        const { collection } = req.params;
        const { field, value } = req.query;

        if (!field || !value) {
            return res.status(400).json({ error: 'field and value query parameters required' });
        }

        const data = db.query(collection, field, value);
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/db/:collection/:id', (req, res) => {
    try {
        const { collection, id } = req.params;
        const updateData = req.body;

        const updated = db.update(collection, id, updateData);
        
        if (!updated) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Broadcast realtime update
        const allData = db.get(collection);
        broadcast(collection, allData);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/db/:collection/:id', (req, res) => {
    try {
        const { collection, id } = req.params;
        const updateData = req.body;

        const updated = db.update(collection, id, updateData);
        
        if (!updated) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Broadcast realtime update
        const allData = db.get(collection);
        broadcast(collection, allData);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/db/:collection/:id', (req, res) => {
    try {
        const { collection, id } = req.params;

        const deleted = db.delete(collection, id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Broadcast realtime update
        const allData = db.get(collection);
        broadcast(collection, allData);

        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth Routes
app.post('/auth/register', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const result = auth.register(email, password);
        
        if (result.error) {
            return res.status(400).json(result);
        }
        
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password required' });
        }
        
        const result = auth.login(email, password);
        
        if (result.error) {
            return res.status(401).json(result);
        }
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/auth/logout', authMiddleware, (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const result = auth.logout(token);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// Protected DB routes (optional - require auth)
app.use('/db', authMiddleware);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✓ REST API running on port ${PORT}`);
    console.log(`✓ Mini Firebase ready!`);
});
