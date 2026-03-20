class MiniFirebase {
    constructor(httpUrl = 'http://localhost:3000', wsUrl = 'ws://localhost:3001') {
        this.httpUrl = httpUrl;
        this.wsUrl = wsUrl;
        this.ws = null;
        this.listeners = new Map();
        this.reconnectDelay = 3000;
        this.token = null;
        this.apiKey = null;
        this.projectId = null;
    }

    async connect() {
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
        const col = new Collection(this, name);
        col.getToken = () => this.token;
        col.getApiKey = () => this.apiKey;
        col.getProjectId = () => this.projectId;
        return col;
    }

    async disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    // Project methods
    async createProject(name, description = '') {
        const response = await fetch(`${this.httpUrl}/projects`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ name, description })
        });
        return await response.json();
    }

    async getProjects() {
        const response = await fetch(`${this.httpUrl}/projects`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    }

    async setProject(projectId, apiKey) {
        this.projectId = projectId;
        this.apiKey = apiKey;
    }

    // Auth methods
    async register(email, password) {
        const response = await fetch(`${this.httpUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        if (result.token) {
            this.token = result.token;
        }
        return result;
    }

    async login(email, password) {
        const response = await fetch(`${this.httpUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        if (result.token) {
            this.token = result.token;
        }
        return result;
    }

    async logout() {
        if (!this.token) return { error: 'Not logged in' };
        
        const response = await fetch(`${this.httpUrl}/auth/logout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        this.token = null;
        return await response.json();
    }

    async getCurrentUser() {
        if (!this.token) return { error: 'Not logged in' };
        
        const response = await fetch(`${this.httpUrl}/auth/me`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        
        return await response.json();
    }

    setToken(token) {
        this.token = token;
    }
}

class Collection {
    constructor(db, name) {
        this.db = db;
        this.name = name;
    }

    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const apiKey = this.db.getApiKey ? this.db.getApiKey() : null;
        const token = this.db.getToken ? this.db.getToken() : null;
        
        if (apiKey) {
            headers['x-api-key'] = apiKey;
        } else if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    _getBaseUrl() {
        const projectId = this.db.getProjectId ? this.db.getProjectId() : null;
        if (projectId) {
            return `${this.db.httpUrl}/api/${projectId}/db/${this.name}`;
        }
        return `${this.db.httpUrl}/db/${this.name}`;
    }

    async add(data) {
        const response = await fetch(this._getBaseUrl(), {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    }

    async get(query) {
        let url = this._getBaseUrl();

        if (query && query.field && query.value) {
            url += `/query?field=${query.field}&value=${query.value}`;
        }

        const response = await fetch(url, {
            headers: this._getHeaders()
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    }

    async queryAdvanced(options) {
        const url = this._getBaseUrl() + '/query';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify(options)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    }

    async update(id, data) {
        const response = await fetch(`${this.db.httpUrl}/db/${this.name}/${id}`, {
            method: 'PUT',
            headers: this._getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    }

    async delete(id) {
        const response = await fetch(`${this.db.httpUrl}/db/${this.name}/${id}`, {
            method: 'DELETE',
            headers: this._getHeaders()
        });

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
