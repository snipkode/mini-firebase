const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const authFile = path.join(__dirname, '../data/.auth.json');

// Ensure auth file exists
if (!fs.existsSync(authFile)) {
    fs.writeFileSync(authFile, '[]');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function loadUsers() {
    try {
        const content = fs.readFileSync(authFile, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(authFile, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = {
    // Register new user
    register: (email, password) => {
        const users = loadUsers();
        
        if (users.find(u => u.email === email)) {
            return { error: 'User already exists' };
        }
        
        const user = {
            id: generateToken().substring(0, 16),
            email,
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        saveUsers(users);
        
        const token = generateToken();
        user.token = token;
        
        // Save token
        const tokens = loadTokens();
        tokens[token] = user.id;
        saveTokens(tokens);
        
        delete user.password;
        return { user, token };
    },
    
    // Login user
    login: (email, password) => {
        const users = loadUsers();
        const user = users.find(u => u.email === email && u.password === hashPassword(password));
        
        if (!user) {
            return { error: 'Invalid credentials' };
        }
        
        const token = generateToken();
        
        // Save token
        const tokens = loadTokens();
        tokens[token] = user.id;
        saveTokens(tokens);
        
        return {
            user: { id: user.id, email: user.email },
            token
        };
    },
    
    // Validate token
    validateToken: (token) => {
        const tokens = loadTokens();
        const userId = tokens[token];
        
        if (!userId) {
            return null;
        }
        
        const users = loadUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return null;
        }
        
        return { id: user.id, email: user.email };
    },
    
    // Logout user
    logout: (token) => {
        const tokens = loadTokens();
        delete tokens[token];
        saveTokens(tokens);
        return { success: true };
    },
    
    // Get current user
    getCurrentUser: (token) => {
        const user = module.exports.validateToken(token);
        if (!user) {
            return { error: 'Invalid token' };
        }
        return { user };
    }
};

function loadTokens() {
    const tokensFile = path.join(__dirname, '../data/.tokens.json');
    try {
        const content = fs.readFileSync(tokensFile, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return {};
    }
}

function saveTokens(tokens) {
    const tokensFile = path.join(__dirname, '../data/.tokens.json');
    fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
}
