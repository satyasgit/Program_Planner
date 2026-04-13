// MCP Server Authentication Middleware
// Handles JWT, API Key, and OAuth authentication

const crypto = require('crypto');
const { promisify } = require('util');

// Simple JWT implementation without external dependencies
class JWTHandler {
    constructor(secret) {
        this.secret = secret || process.env.JWT_SECRET || 'mcp-server-secret-key';
    }

    // Create JWT token
    sign(payload, expiresIn = '24h') {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const expirationTime = this.parseExpiration(expiresIn);
        
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + expirationTime
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
        
        const signature = this.createSignature(encodedHeader, encodedPayload);
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    // Verify JWT token
    verify(token) {
        try {
            const [header, payload, signature] = token.split('.');
            
            if (!header || !payload || !signature) {
                throw new Error('Invalid token format');
            }

            // Verify signature
            const expectedSignature = this.createSignature(header, payload);
            if (signature !== expectedSignature) {
                throw new Error('Invalid signature');
            }

            // Decode and verify payload
            const decodedPayload = JSON.parse(this.base64UrlDecode(payload));
            
            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (decodedPayload.exp && decodedPayload.exp < now) {
                throw new Error('Token expired');
            }

            return decodedPayload;
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    // Create HMAC signature
    createSignature(header, payload) {
        const hmac = crypto.createHmac('sha256', this.secret);
        hmac.update(`${header}.${payload}`);
        return this.base64UrlEncode(hmac.digest());
    }

    // Base64 URL encoding
    base64UrlEncode(str) {
        if (typeof str !== 'string') {
            str = str.toString('base64');
        } else {
            str = Buffer.from(str).toString('base64');
        }
        return str.replace(/=/g, '')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_');
    }

    // Base64 URL decoding
    base64UrlDecode(str) {
        str += '='.repeat((4 - str.length % 4) % 4);
        str = str.replace(/-/g, '+')
                 .replace(/_/g, '/');
        return Buffer.from(str, 'base64').toString();
    }

    // Parse expiration time
    parseExpiration(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('Invalid expiration format');
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        const units = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400
        };

        return value * units[unit];
    }
}

// API Key validation
class APIKeyValidator {
    constructor() {
        this.apiKeys = new Map();
        // Load API keys from environment or database
        this.loadAPIKeys();
    }

    loadAPIKeys() {
        // In production, load from database
        // For now, use environment variables
        if (process.env.API_KEYS) {
            const keys = JSON.parse(process.env.API_KEYS);
            Object.entries(keys).forEach(([name, key]) => {
                this.apiKeys.set(key, { name, permissions: ['read', 'write'] });
            });
        }
        
        // Default development key
        this.apiKeys.set('dev-api-key-123', {
            name: 'Development',
            permissions: ['read', 'write', 'admin']
        });
    }

    validate(apiKey) {
        return this.apiKeys.get(apiKey);
    }

    hasPermission(apiKey, permission) {
        const keyData = this.validate(apiKey);
        return keyData && keyData.permissions.includes(permission);
    }
}

// OAuth handler for JIRA
class OAuthHandler {
    constructor() {
        this.clientId = process.env.JIRA_CLIENT_ID;
        this.clientSecret = process.env.JIRA_CLIENT_SECRET;
        this.redirectUri = process.env.JIRA_REDIRECT_URI || 'http://localhost:3001/auth/callback';
    }

    // Generate OAuth authorization URL
    getAuthorizationUrl(state) {
        const baseUrl = 'https://auth.atlassian.com/authorize';
        const params = new URLSearchParams({
            audience: 'api.atlassian.com',
            client_id: this.clientId,
            scope: 'read:jira-work read:jira-user write:jira-work offline_access',
            redirect_uri: this.redirectUri,
            state: state,
            response_type: 'code',
            prompt: 'consent'
        });

        return `${baseUrl}?${params.toString()}`;
    }

    // Exchange authorization code for access token
    async exchangeCodeForToken(code) {
        // This would normally use fetch or axios
        // For now, return mock response
        return {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'Bearer'
        };
    }
}

// Initialize handlers
const jwtHandler = new JWTHandler();
const apiKeyValidator = new APIKeyValidator();
const oauthHandler = new OAuthHandler();

// Authentication middleware
const authenticate = (req, res, next) => {
    try {
        // Check for JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwtHandler.verify(token);
                req.user = decoded;
                req.authType = 'jwt';
                return next();
            } catch (error) {
                // Continue to check other auth methods
            }
        }

        // Check for API key
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;
        if (apiKey) {
            const keyData = apiKeyValidator.validate(apiKey);
            if (keyData) {
                req.user = { name: keyData.name, permissions: keyData.permissions };
                req.authType = 'apiKey';
                req.apiKey = apiKey;
                return next();
            }
        }

        // Check for OAuth token (for JIRA requests)
        if (authHeader && authHeader.startsWith('OAuth ')) {
            const token = authHeader.substring(6);
            // Validate OAuth token (simplified for now)
            req.user = { oauthToken: token };
            req.authType = 'oauth';
            return next();
        }

        // No valid authentication found
        res.status(401).json({
            error: 'Authentication required',
            message: 'Please provide a valid JWT token, API key, or OAuth token'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Authentication error',
            message: error.message
        });
    }
};

// Permission checking middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (req.authType === 'apiKey') {
            if (apiKeyValidator.hasPermission(req.apiKey, permission)) {
                return next();
            }
        } else if (req.authType === 'jwt' && req.user.permissions) {
            if (req.user.permissions.includes(permission)) {
                return next();
            }
        } else if (req.authType === 'oauth') {
            // OAuth tokens have full permissions for now
            return next();
        }

        res.status(403).json({
            error: 'Insufficient permissions',
            message: `Permission '${permission}' required`
        });
    };
};

// Role checking middleware
const requireRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            return next();
        }

        res.status(403).json({
            error: 'Insufficient role',
            message: `Role '${role}' required`
        });
    };
};

// Rate limiting storage
const rateLimitStore = new Map();

// Simple rate limiting middleware
const rateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // limit each IP to 100 requests per windowMs
        message = 'Too many requests, please try again later'
    } = options;

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const record = rateLimitStore.get(key);
        
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }

        if (record.count >= max) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: message,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }

        record.count++;
        next();
    };
};

// Export authentication utilities
module.exports = {
    authenticate,
    requirePermission,
    requireRole,
    rateLimit,
    jwtHandler,
    apiKeyValidator,
    oauthHandler,
    
    // Utility functions
    generateToken: (payload, expiresIn) => jwtHandler.sign(payload, expiresIn),
    verifyToken: (token) => jwtHandler.verify(token),
    validateAPIKey: (apiKey) => apiKeyValidator.validate(apiKey),
    getOAuthUrl: (state) => oauthHandler.getAuthorizationUrl(state)
};