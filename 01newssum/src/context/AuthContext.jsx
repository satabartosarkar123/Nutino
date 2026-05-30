import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getToken,
    setToken,
    removeToken,
    registerUser,
    loginUser,
    oauthLogin,
    fetchProfile,
} from '../api/authAPI';

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ── Rehydrate session on mount ──────────────────────────────────
    useEffect(() => {
        const rehydrate = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetchProfile();
                if (res.status === 'success' && res.user) {
                    setUser(res.user);
                } else {
                    // Token is invalid or expired — clean up
                    removeToken();
                }
            } catch {
                removeToken();
            } finally {
                setLoading(false);
            }
        };

        rehydrate();
    }, []);

    // ── Native Registration ─────────────────────────────────────────
    const register = async (name, email, password) => {
        const res = await registerUser(name, email, password);

        if (res.status === 'success') {
            setToken(res.token);
            setUser(res.user);

            if (!res.user.onboarded) {
                navigate('/onboard');
            } else {
                navigate('/');
            }
        }

        return res;
    };

    // ── Native Login ────────────────────────────────────────────────
    const login = async (email, password) => {
        const res = await loginUser(email, password);

        if (res.status === 'success') {
            setToken(res.token);
            setUser(res.user);

            if (!res.user.onboarded) {
                navigate('/onboard');
            } else {
                navigate('/');
            }
        }

        return res;
    };

    // ── Google OAuth Login ──────────────────────────────────────────
    const googleLogin = async (credential) => {
        const res = await oauthLogin(credential, 'google');

        if (res.status === 'success') {
            setToken(res.token);
            setUser(res.user);

            if (!res.user.onboarded) {
                navigate('/onboard');
            } else {
                navigate('/');
            }
        }

        return res;
    };

    // ── Logout ──────────────────────────────────────────────────────
    const logout = () => {
        removeToken();
        setUser(null);
        navigate('/login');
    };

    // ── Update user after onboarding ────────────────────────────────
    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
