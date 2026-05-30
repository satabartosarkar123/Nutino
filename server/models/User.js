/**
 * Nutino — User Model
 *
 * Stores authentication credentials and an analytical persona profile
 * used to dynamically customise Gemini Pro summarization prompts.
 *
 * OAuth accounts have a null password_hash and are identified by
 * the compound index (auth_provider, provider_user_id).
 */

import mongoose from 'mongoose';

// ─── Profile Sub-Schema ──────────────────────────────────────────────────────

const profileSchema = new mongoose.Schema(
    {
        persona: {
            type: String,
            enum: ['Investor', 'Researcher', 'Student', 'Founder', 'Generalist'],
            default: 'Generalist',
        },
        primary_interests: {
            type: [String],
            default: [],
        },
        ignored_topics: {
            type: [String],
            default: [],
        },
        summary_depth: {
            type: String,
            enum: ['bullet_points', 'deep_analysis', 'exec_summary'],
            default: 'bullet_points',
        },
    },
    { _id: false }
);

// ─── User Schema ─────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },
        password_hash: {
            type: String,
            default: null,
        },
        auth_provider: {
            type: String,
            enum: ['native', 'google', 'facebook', 'apple'],
            default: 'native',
        },
        provider_user_id: {
            type: String,
            default: null,
        },
        onboarded: {
            type: Boolean,
            default: false,
        },
        profile: {
            type: profileSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Sparse index on provider_user_id (only set for OAuth users)
userSchema.index({ provider_user_id: 1 }, { sparse: true });

// Compound index for fast OAuth user lookup
userSchema.index({ auth_provider: 1, provider_user_id: 1 });

// ─── JSON Serialization ─────────────────────────────────────────────────────

// Strip password_hash and __v from all JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password_hash;
    delete obj.__v;
    return obj;
};

// ─── Export ──────────────────────────────────────────────────────────────────

const User = mongoose.model('User', userSchema);
export default User;
