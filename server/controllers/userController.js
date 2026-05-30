/**
 * Nutino — User Controller
 *
 * Handles user profile operations:
 *   - PUT /api/user/onboard  — Complete onboarding with persona profile
 *   - GET /api/user/profile  — Retrieve current user profile
 *
 * All routes require the authenticate middleware (req.user must exist).
 */

import User from '../models/User.js';
import { getAllSubTopics } from '../config/taxonomy.js';

// Cache the valid topics set once at module load
const VALID_TOPICS = getAllSubTopics();

const VALID_PERSONAS = ['Investor', 'Researcher', 'Student', 'Founder', 'Generalist'];
const VALID_DEPTHS = ['bullet_points', 'deep_analysis', 'exec_summary'];

// ─── PUT /api/user/onboard ──────────────────────────────────────────────────

export const onboardUser = async (req, res) => {
    try {
        const { persona, primary_interests, ignored_topics, summary_depth } = req.body;

        // ── Validate persona ────────────────────────────────────────────
        if (!persona || !VALID_PERSONAS.includes(persona)) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid persona. Must be one of: ${VALID_PERSONAS.join(', ')}.`,
            });
        }

        // ── Validate summary_depth ──────────────────────────────────────
        if (!summary_depth || !VALID_DEPTHS.includes(summary_depth)) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid summary_depth. Must be one of: ${VALID_DEPTHS.join(', ')}.`,
            });
        }

        // ── Validate primary_interests ──────────────────────────────────
        if (!Array.isArray(primary_interests) || primary_interests.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'primary_interests must be a non-empty array of topic strings.',
            });
        }

        if (primary_interests.length > 15) {
            return res.status(400).json({
                status: 'error',
                message: 'primary_interests cannot exceed 15 topics.',
            });
        }

        const invalidInterests = primary_interests.filter(
            (topic) => typeof topic !== 'string' || !VALID_TOPICS.has(topic)
        );

        if (invalidInterests.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid primary_interests: ${invalidInterests.join(', ')}. Must be valid IPTC sub-topics.`,
            });
        }

        // ── Validate ignored_topics (optional, can be empty) ────────────
        let sanitizedIgnored = [];

        if (ignored_topics !== undefined) {
            if (!Array.isArray(ignored_topics)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ignored_topics must be an array of topic strings.',
                });
            }

            if (ignored_topics.length > 15) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ignored_topics cannot exceed 15 topics.',
                });
            }

            const invalidIgnored = ignored_topics.filter(
                (topic) => typeof topic !== 'string' || !VALID_TOPICS.has(topic)
            );

            if (invalidIgnored.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: `Invalid ignored_topics: ${invalidIgnored.join(', ')}. Must be valid IPTC sub-topics.`,
                });
            }

            sanitizedIgnored = ignored_topics;
        }

        // ── Check for overlap between interests and ignored ─────────────
        const overlap = primary_interests.filter(
            (topic) => sanitizedIgnored.includes(topic)
        );

        if (overlap.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Topics cannot appear in both interests and ignored: ${overlap.join(', ')}.`,
            });
        }

        // ── Update user profile ─────────────────────────────────────────
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.persona': persona,
                    'profile.primary_interests': primary_interests,
                    'profile.ignored_topics': sanitizedIgnored,
                    'profile.summary_depth': summary_depth,
                    onboarded: true,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found.',
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Onboarding completed successfully.',
            user: updatedUser,
        });
    } catch (error) {
        console.error('[USER] Onboarding error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during onboarding.',
        });
    }
};

// ─── GET /api/user/profile ──────────────────────────────────────────────────

export const getProfile = async (req, res) => {
    try {
        // req.user is already hydrated by the authenticate middleware
        return res.status(200).json({
            status: 'success',
            user: req.user,
        });
    } catch (error) {
        console.error('[USER] Profile fetch error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching profile.',
        });
    }
};
