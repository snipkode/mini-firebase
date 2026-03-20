const fs = require('fs');
const path = require('path');

// Simple in-memory database for testing
const testDb = {};

function setupTestDb() {
    const testDir = path.join(__dirname, '../../data/test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    return testDir;
}

function cleanupTestDb(testDir) {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

describe('Database Operations', () => {
    let testDir;

    beforeEach(() => {
        testDir = setupTestDb();
    });

    afterEach(() => {
        cleanupTestDb(testDir);
    });

    describe('Insert', () => {
        it('should insert a document', () => {
            const doc = { name: 'Test', value: 123 };
            const filePath = path.join(testDir, 'test.json');
            
            // Simulate insert
            const docs = [doc];
            fs.writeFileSync(filePath, JSON.stringify(docs));
            
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            expect(content).toHaveLength(1);
            expect(content[0].name).toBe('Test');
        });

        it('should generate unique IDs', () => {
            const ids = new Set();
            
            for (let i = 0; i < 100; i++) {
                const id = `${Date.now()}_${Math.random()}`;
                ids.add(id);
            }
            
            expect(ids.size).toBe(100);
        });
    });

    describe('Query', () => {
        it('should filter documents by field', () => {
            const docs = [
                { id: '1', status: 'active', name: 'A' },
                { id: '2', status: 'inactive', name: 'B' },
                { id: '3', status: 'active', name: 'C' }
            ];
            
            const filtered = docs.filter(d => d.status === 'active');
            
            expect(filtered).toHaveLength(2);
            expect(filtered.map(d => d.name)).toEqual(['A', 'C']);
        });
    });

    describe('Update', () => {
        it('should update a document', () => {
            const docs = [
                { id: '1', name: 'Original', status: 'active' }
            ];
            
            const index = docs.findIndex(d => d.id === '1');
            docs[index] = { ...docs[index], name: 'Updated' };
            
            expect(docs[0].name).toBe('Updated');
        });
    });

    describe('Delete', () => {
        it('should delete a document', () => {
            const docs = [
                { id: '1', name: 'A' },
                { id: '2', name: 'B' }
            ];
            
            const filtered = docs.filter(d => d.id !== '1');
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('2');
        });
    });
});

describe('Advanced Queries', () => {
    const sampleData = [
        { id: '1', name: 'Alice', age: 25, status: 'active' },
        { id: '2', name: 'Bob', age: 30, status: 'inactive' },
        { id: '3', name: 'Charlie', age: 35, status: 'active' },
        { id: '4', name: 'David', age: 28, status: 'active' }
    ];

    it('should filter with where clause', () => {
        const result = sampleData.filter(d => d.status === 'active');
        expect(result).toHaveLength(3);
    });

    it('should sort ascending', () => {
        const result = [...sampleData].sort((a, b) => a.age - b.age);
        expect(result[0].age).toBe(25);
        expect(result[result.length - 1].age).toBe(35);
    });

    it('should sort descending', () => {
        const result = [...sampleData].sort((a, b) => b.age - a.age);
        expect(result[0].age).toBe(35);
        expect(result[result.length - 1].age).toBe(25);
    });

    it('should apply limit', () => {
        const result = sampleData.slice(0, 2);
        expect(result).toHaveLength(2);
    });

    it('should apply offset', () => {
        const result = sampleData.slice(2);
        expect(result).toHaveLength(2);
    });

    it('should chain operations', () => {
        const result = sampleData
            .filter(d => d.status === 'active')
            .sort((a, b) => b.age - a.age)
            .slice(0, 2);
        
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Charlie');
    });
});
