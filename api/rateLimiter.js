const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Rate limit configuration
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: Math.ceil(WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again after 15 minutes'
    },
    skipSuccessfulRequests: true
});

// Project creation limiter
const projectLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 projects per hour (increased for development)
    message: {
        error: 'Too many projects created',
        message: 'Maximum 100 projects per hour allowed'
    }
});

// Database operations limiter (per collection)
const dbLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
        error: 'Too many database operations',
        message: 'Rate limit exceeded for database operations'
    }
});

// Write operations limiter (insert, update, delete)
const writeLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 20, // 20 write operations per 10 seconds
    message: {
        error: 'Too many write operations',
        message: 'Write rate limit exceeded. Please slow down.'
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    projectLimiter,
    dbLimiter,
    writeLimiter
};
