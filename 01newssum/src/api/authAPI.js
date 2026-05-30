import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

/**
 * Get the stored JWT token from localStorage.
 */
export function getToken() {
    return localStorage.getItem('nutino_token');
}

/**
 * Store the JWT token in localStorage.
 */
export function setToken(token) {
    localStorage.setItem('nutino_token', token);
}

/**
 * Remove the JWT token from localStorage.
 */
export function removeToken() {
    localStorage.removeItem('nutino_token');
}

/**
 * Create an axios instance with the auth header pre-attached.
 */
function authClient() {
    const token = getToken();
    return axios.create({
        baseURL: API_BASE,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

// ─── Auth Endpoints (public) ─────────────────────────────────────────────────

export async function registerUser(name, email, password) {
    try {
        const res = await axios.post(`${API_BASE}/api/auth/register`, {
            name,
            email,
            password,
        });
        return res.data;
    } catch (error) {
        const msg =
            error.response?.data?.message ||
            'Registration failed. Please try again.';
        return { status: 'error', message: msg };
    }
}

export async function loginUser(email, password) {
    try {
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
            email,
            password,
        });
        return res.data;
    } catch (error) {
        const msg =
            error.response?.data?.message ||
            'Login failed. Please try again.';
        return { status: 'error', message: msg };
    }
}

export async function oauthLogin(idToken, provider = 'google') {
    try {
        const res = await axios.post(`${API_BASE}/api/auth/oauth-login`, {
            id_token: idToken,
            provider,
        });
        return res.data;
    } catch (error) {
        const msg =
            error.response?.data?.message ||
            'OAuth login failed. Please try again.';
        return { status: 'error', message: msg };
    }
}

// ─── User Endpoints (authenticated) ─────────────────────────────────────────

export async function fetchProfile() {
    try {
        const res = await authClient().get('/api/user/profile');
        return res.data;
    } catch (error) {
        const msg =
            error.response?.data?.message ||
            'Failed to fetch profile.';
        return { status: 'error', message: msg };
    }
}

export async function submitOnboarding(profileData) {
    try {
        const res = await authClient().put('/api/user/onboard', profileData);
        return res.data;
    } catch (error) {
        const msg =
            error.response?.data?.message ||
            'Onboarding failed. Please try again.';
        return { status: 'error', message: msg };
    }
}
