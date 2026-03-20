const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectsFile = path.join(__dirname, '../data/.projects.json');

// Ensure projects file exists
if (!fs.existsSync(projectsFile)) {
    fs.writeFileSync(projectsFile, '[]');
}

function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

function generateApiKey() {
    return 'mf_' + crypto.randomBytes(24).toString('hex');
}

function loadProjects() {
    try {
        const content = fs.readFileSync(projectsFile, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
}

function saveProjects(projects) {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

module.exports = {
    // Create new project
    createProject: (userId, name, description = '') => {
        const projects = loadProjects();
        
        const project = {
            id: generateId(),
            ownerId: userId,
            name,
            description,
            createdAt: new Date().toISOString(),
            apiKeys: []
        };
        
        projects.push(project);
        saveProjects(projects);
        
        // Generate default API key
        const apiKey = generateApiKey();
        project.apiKeys.push({
            key: apiKey,
            name: 'Default Key',
            createdAt: new Date().toISOString()
        });
        
        saveProjects(projects);
        
        return { project, apiKey };
    },
    
    // Get user projects
    getUserProjects: (userId) => {
        const projects = loadProjects();
        return projects.filter(p => p.ownerId === userId);
    },
    
    // Get project by ID
    getProject: (projectId) => {
        const projects = loadProjects();
        return projects.find(p => p.id === projectId);
    },
    
    // Validate API key
    validateApiKey: (apiKey) => {
        const projects = loadProjects();
        for (const project of projects) {
            const keyObj = project.apiKeys.find(k => k.key === apiKey);
            if (keyObj) {
                return { projectId: project.id, ownerId: project.ownerId, key: keyObj };
            }
        }
        return null;
    },
    
    // Create new API key
    createApiKey: (projectId, name) => {
        const projects = loadProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
            return { error: 'Project not found' };
        }
        
        const apiKey = generateApiKey();
        const keyObj = {
            key: apiKey,
            name,
            createdAt: new Date().toISOString()
        };
        
        project.apiKeys.push(keyObj);
        saveProjects(projects);
        
        return { key: apiKey, keyObj };
    },
    
    // Revoke API key
    revokeApiKey: (projectId, apiKey) => {
        const projects = loadProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
            return { error: 'Project not found' };
        }
        
        const initialLength = project.apiKeys.length;
        project.apiKeys = project.apiKeys.filter(k => k.key !== apiKey);
        
        if (project.apiKeys.length === initialLength) {
            return { error: 'API key not found' };
        }
        
        saveProjects(projects);
        return { success: true };
    },
    
    // Delete project
    deleteProject: (projectId) => {
        const projects = loadProjects();
        const initialLength = projects.length;
        const newProjects = projects.filter(p => p.id !== projectId);
        
        if (newProjects.length === initialLength) {
            return { error: 'Project not found' };
        }
        
        saveProjects(newProjects);
        return { success: true };
    },
    
    // Update project
    updateProject: (projectId, updates) => {
        const projects = loadProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
            return { error: 'Project not found' };
        }
        
        if (updates.name) project.name = updates.name;
        if (updates.description) project.description = updates.description;
        
        saveProjects(projects);
        return { project };
    }
};
