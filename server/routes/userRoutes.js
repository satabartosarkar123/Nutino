/**
 * Nutino — User Routes
 *
 * PUT  /api/user/onboard  → Complete onboarding with persona profile
 * GET  /api/user/profile  → Retrieve authenticated user's profile
 *
 * All routes are protected by the authenticate middleware.
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { onboardUser, getProfile } from '../controllers/userController.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Onboarding
router.put('/onboard', onboardUser);

// Profile
router.get('/profile', getProfile);

export default router;
