class MiniFirebase {
    constructor(httpUrl = 'http://localhost:3000', wsUrl = 'ws://localhost:3001') {
        this.httpUrl = httpUrl;
        this.wsUrl = wsUrl;
        this.ws = null;
        this.listeners = new Map();
        this.reconnectDelay = 3000;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);
                
                this.ws.onopen = () => {
                    console.log('✓ Connected to Mini Firebase');
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    const msg = JSON.parse(event.data);
                    
                    if (msg.type === 'update') {
                        const collectionListeners = this.listeners.get(msg.collection) || [];
                        collectionListeners.forEach(callback => callback(msg.data));
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('⚠ Disconnected, reconnecting...');
                    setTimeout(() => this.connect(), this.reconnectDelay);
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
            } catch (err) {
                console.warn('WebSocket not available, using HTTP only');
                resolve();
            }
        });
    }

    collection(name) {
        return new Collection(this, name);
    }

    async disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

class Collection {
    constructor(db, name) {
        this.db = db;
        this.name = name;
    }

    async add(data) {
        const response = await fetch(`${this.db.httpUrl}/db/${this.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        return await response.json();
    }

    async get(query) {
        let url = `${this.db.httpUrl}/db/${this.name}`;
        
        if (query && query.field && query.value) {
            url += `/query?field=${query.field}&value=${query.value}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        return await response.json();
    }

    async onSnapshot(callback) {
        if (!this.db.ws || this.db.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, realtime updates unavailable');
            return () => {};
        }
        
        const listeners = this.db.listeners.get(this.name) || [];
        listeners.push(callback);
        this.db.listeners.set(this.name, listeners);
        
        this.db.ws.send(JSON.stringify({
            type: 'subscribe',
            collection: this.name
        }));
        
        // Return unsubscribe function
        return () => {
            const currentListeners = this.db.listeners.get(this.name) || [];
            const index = currentListeners.indexOf(callback);
            if (index > -1) {
                currentListeners.splice(index, 1);
                this.db.listeners.set(this.name, currentListeners);
            }
            
            if (this.db.ws && this.db.ws.readyState === WebSocket.OPEN) {
                this.db.ws.send(JSON.stringify({
                    type: 'unsubscribe',
                    collection: this.name
                }));
            }
        };
    }
}

// Browser/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniFirebase;
}

if (typeof window !== 'undefined') {
    window.MiniFirebase = MiniFirebase;
}
