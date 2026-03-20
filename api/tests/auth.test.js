const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../auth');
jest.mock('../tenant');

const app = express();
app.use(express.json());

// Import routes after mocking
const auth = require('../auth');

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            auth.register.mockReturnValue({
                user: { id: '123', email: 'test@example.com' },
                token: 'token123'
            });

            const res = await request(app)
                .post('/auth/register')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should reject invalid email', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ email: 'invalid', password: 'password123' });

            expect(res.statusCode).toBe(400);
        });

        it('should reject short password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ email: 'test@example.com', password: '123' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            auth.login.mockReturnValue({
                user: { id: '123', email: 'test@example.com' },
                token: 'token123'
            });

            const res = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject invalid credentials', async () => {
            auth.login.mockReturnValue({ error: 'Invalid credentials' });

            const res = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('error');
        });
    });
});
