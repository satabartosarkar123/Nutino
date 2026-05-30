/**
 * Nutino — Auth Controller
 *
 * Handles native registration/login (bcryptjs + JWT) and
 * OAuth login (Google ID token verification via google-auth-library).
 *
 * All responses follow the shape:
 *   { status: 'success'|'error', message?, token?, user? }
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

/**
 * Generate a signed JWT containing the user's Mongo _id.
 */
function signToken(userId) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
        throw new Error('JWT_SECRET is not set in environment variables');
    }

    return jwt.sign({ id: userId }, secret, { expiresIn });
}

/**
 * Validate an email format.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── POST /api/auth/register ────────────────────────────────────────────────

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // ── Input validation ────────────────────────────────────────────
        if (!name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required: name, email, password.',
            });
        }

        if (typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Name must be at least 2 characters long.',
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a valid email address.',
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters long.',
            });
        }

        // ── Duplicate check ─────────────────────────────────────────────
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists.',
            });
        }

        // ── Create user ─────────────────────────────────────────────────
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password_hash: passwordHash,
            auth_provider: 'native',
        });

        // ── Generate token ──────────────────────────────────────────────
        const token = signToken(user._id);

        return res.status(201).json({
            status: 'success',
            message: 'Account created successfully.',
            token,
            user,
        });
    } catch (error) {
        console.error('[AUTH] Registration error:', error.message);

        // Handle Mongoose duplicate key error (race condition)
        if (error.code === 11000) {
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists.',
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during registration.',
        });
    }
};

// ─── POST /api/auth/login ───────────────────────────────────────────────────

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ── Input validation ────────────────────────────────────────────
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required.',
            });
        }

        // ── Find user (include password_hash for comparison) ────────────
        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+password_hash');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.',
            });
        }

        // ── Check if user registered via OAuth ──────────────────────────
        if (user.auth_provider !== 'native') {
            return res.status(400).json({
                status: 'error',
                message: `This account uses ${user.auth_provider} sign-in. Please log in with ${user.auth_provider}.`,
            });
        }

        // ── Verify password ─────────────────────────────────────────────
        if (!user.password_hash) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.',
            });
        }

        // ── Generate token ──────────────────────────────────────────────
        const token = signToken(user._id);

        return res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            token,
            user,
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during login.',
        });
    }
};

// ─── POST /api/auth/oauth-login ─────────────────────────────────────────────

export const oauthLogin = async (req, res) => {
    try {
        const { id_token, provider } = req.body;

        // ── Input validation ────────────────────────────────────────────
        if (!id_token || !provider) {
            return res.status(400).json({
                status: 'error',
                message: 'Both id_token and provider are required.',
            });
        }

        const supportedProviders = ['google', 'facebook', 'apple'];
        if (!supportedProviders.includes(provider)) {
            return res.status(400).json({
                status: 'error',
                message: `Unsupported provider: ${provider}. Supported: ${supportedProviders.join(', ')}.`,
            });
        }

        // ── Provider-specific verification ──────────────────────────────
        let providerPayload;

        switch (provider) {
            case 'google':
                providerPayload = await verifyGoogleToken(id_token);
                break;

            case 'facebook':
                return res.status(501).json({
                    status: 'error',
                    message: 'Facebook OAuth is not yet implemented. Coming soon.',
                });

            case 'apple':
                return res.status(501).json({
                    status: 'error',
                    message: 'Apple OAuth is not yet implemented. Coming soon.',
                });

            default:
                return res.status(400).json({
                    status: 'error',
                    message: `Unsupported provider: ${provider}.`,
                });
        }

        // ── Find or create user ─────────────────────────────────────────
        let user = await User.findOne({
            auth_provider: provider,
            provider_user_id: providerPayload.sub,
        });

        let isNewUser = false;

        if (!user) {
            // Check if a native account exists with the same email
            const existingNative = await User.findOne({
                email: providerPayload.email,
                auth_provider: 'native',
            });

            if (existingNative) {
                return res.status(409).json({
                    status: 'error',
                    message: 'An account with this email already exists using email/password login. Please log in with your password or link your Google account.',
                });
            }

            user = await User.create({
                name: providerPayload.name || providerPayload.email.split('@')[0],
                email: providerPayload.email,
                password_hash: null,
                auth_provider: provider,
                provider_user_id: providerPayload.sub,
            });

            isNewUser = true;
        }

        // ── Generate token ──────────────────────────────────────────────
        const token = signToken(user._id);

        return res.status(isNewUser ? 201 : 200).json({
            status: 'success',
            message: isNewUser ? 'Account created via OAuth.' : 'OAuth login successful.',
            token,
            user,
            is_new_user: isNewUser,
        });
    } catch (error) {
        console.error('[AUTH] OAuth login error:', error.message);

        // Handle Mongoose duplicate key error (race condition)
        if (error.code === 11000) {
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists.',
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during OAuth login.',
        });
    }
};

// ─── Google ID Token Verification ───────────────────────────────────────────

/**
 * Verify a Google ID token server-side using google-auth-library.
 * Returns the token payload containing sub, email, name, picture.
 */
async function verifyGoogleToken(idToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw new Error('GOOGLE_CLIENT_ID is not set in environment variables');
    }

    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        throw new Error('Google token verification returned an invalid payload');
    }

    if (!payload.email_verified) {
        throw new Error('Google account email is not verified');
    }

    return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || null,
    };
}
