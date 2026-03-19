const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✓ REST API running on port ${PORT}`);
    console.log(`✓ Mini Firebase ready!`);
});
