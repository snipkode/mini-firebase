const { body, param, query, validationResult } = require('express-validator');

// Validation middleware factory
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

// Collection name validation
const validateCollection = [
    param('collection')
        .exists()
        .isString()
        .matches(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
        .withMessage('Collection name must be alphanumeric with underscores or hyphens')
        .isLength({ min: 1, max: 50 })
        .withMessage('Collection name must be between 1 and 50 characters'),
    validate
];

// Document validation
const validateDocument = (action = 'create') => {
    const rules = [];
    
    if (action === 'create' || action === 'update') {
        rules.push(
            body()
                .custom((value) => {
                    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                        throw new Error('Document must be a JSON object');
                    }
                    return true;
                })
        );
    }
    
    return rules;
};

// Email validation
const validateEmail = [
    body('email')
        .exists()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    validate
];

// Password validation
const validatePassword = [
    body('password')
        .exists()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
        .withMessage('Password contains invalid characters'),
    validate
];

// Project validation
const validateProject = [
    body('name')
        .exists()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Project name must be between 1 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters')
        .trim(),
    validate
];

// ID validation
const validateId = [
    param('id')
        .exists()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Invalid document ID'),
    validate
];

// API key validation
const validateApiKey = [
    param('apiKey')
        .exists()
        .matches(/^mf_[a-f0-9]+$/)
        .withMessage('Invalid API key format'),
    validate
];

// Query parameter validation
const validateQuery = [
    query('field')
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage('Invalid field name'),
    query('value')
        .optional()
        .isString()
        .withMessage('Value must be a string'),
    validate
];

// Advanced query validation
const validateAdvancedQuery = [
    body()
        .custom((value) => {
            // Validate where clause
            if (value.where && typeof value.where !== 'object') {
                throw new Error('where must be an object');
            }
            
            // Validate sortBy
            if (value.sortBy && (typeof value.sortBy !== 'string' || value.sortBy.length > 50)) {
                throw new Error('sortBy must be a string less than 50 characters');
            }
            
            // Validate order
            if (value.order && !['asc', 'desc'].includes(value.order.toLowerCase())) {
                throw new Error('order must be "asc" or "desc"');
            }
            
            // Validate limit
            if (value.limit && (typeof value.limit !== 'number' || value.limit < 1 || value.limit > 1000)) {
                throw new Error('limit must be between 1 and 1000');
            }
            
            // Validate offset
            if (value.offset && (typeof value.offset !== 'number' || value.offset < 0)) {
                throw new Error('offset must be a positive number');
            }
            
            return true;
        }),
    validate
];

module.exports = {
    validate,
    validateCollection,
    validateDocument,
    validateEmail,
    validatePassword,
    validateProject,
    validateId,
    validateApiKey,
    validateQuery,
    validateAdvancedQuery
};
