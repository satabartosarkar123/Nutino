/**
 * Nutino — JWT Authentication Middleware
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it against JWT_SECRET, queries MongoDB for the user,
 * and hydrates req.user with the full user document.
 *
 * Usage:
 *   import { authenticate } from '../middleware/auth.js';
 *   router.get('/protected', authenticate, handler);
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Primary auth gate — attach to any route that requires a logged-in user.
 */
export const authenticate = async (req, res, next) => {
    try {
        // ── 1. Extract token ────────────────────────────────────────────
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Access denied. No authentication token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({
                status: 'error',
                message: 'Access denied. Malformed authentication token.',
            });
        }

        // ── 2. Verify token ────────────────────────────────────────────
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error('[AUTH] FATAL: JWT_SECRET is not set in environment variables');
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error. Authentication service misconfigured.',
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication token has expired. Please log in again.',
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid authentication token.',
                });
            }
            return res.status(401).json({
                status: 'error',
                message: 'Authentication failed.',
            });
        }

        // ── 3. Locate user in MongoDB ───────────────────────────────────
        const user = await User.findById(decoded.id).select('-password_hash');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User associated with this token no longer exists.',
            });
        }

        // ── 4. Hydrate request context ──────────────────────────────────
        req.user = user;
        next();
    } catch (error) {
        console.error('[AUTH] Unexpected error in authentication middleware:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during authentication.',
        });
    }
};

export default authenticate;
