/**
 * Nutino — Auth Routes
 *
 * POST /api/auth/register     → Native registration
 * POST /api/auth/login        → Native login
 * POST /api/auth/oauth-login  → OAuth login (Google / Facebook / Apple)
 *
 * None of these routes require authentication (pre-auth endpoints).
 */

import express from 'express';
import { register, login, oauthLogin } from '../controllers/authController.js';

const router = express.Router();

// Native authentication
router.post('/register', register);
router.post('/login', login);

// OAuth authentication
router.post('/oauth-login', oauthLogin);

export default router;
