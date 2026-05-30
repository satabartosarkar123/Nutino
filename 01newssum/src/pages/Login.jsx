import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { isAuthenticated, user, login, register, googleLogin } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        if (!user.onboarded) return <Navigate to="/onboard" replace />;
        return <Navigate to="/" replace />;
    }

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;
            if (isSignUp) {
                if (!formData.name.trim()) {
                    setError('Name is required.');
                    setLoading(false);
                    return;
                }
                res = await register(
                    formData.name,
                    formData.email,
                    formData.password
                );
            } else {
                res = await login(formData.email, formData.password);
            }

            if (res.status === 'error') {
                setError(res.message);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);

        try {
            const res = await googleLogin(credentialResponse.credential);
            if (res.status === 'error') {
                setError(res.message);
            }
        } catch {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign-in was cancelled or failed.');
    };

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="fixed top-[-10rem] left-[-10rem] w-[40rem] h-[40rem] bg-brand-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="fixed bottom-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/30">
                        N
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Nutino
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-[#1e1b4b]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Tab Switcher */}
                    <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/5">
                        <button
                            onClick={() => {
                                setIsSignUp(false);
                                setError('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                !isSignUp
                                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => {
                                setIsSignUp(true);
                                setError('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                isSignUp
                                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all duration-300"
                                    required={isSignUp}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all duration-300"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={
                                    isSignUp
                                        ? 'Minimum 8 characters'
                                        : 'Enter your password'
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all duration-300"
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm font-medium flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/25 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>
                                        {isSignUp
                                            ? 'Creating Account...'
                                            : 'Signing In...'}
                                    </span>
                                </>
                            ) : (
                                <span>
                                    {isSignUp
                                        ? 'Create Account'
                                        : 'Sign In'}
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            or continue with
                        </span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    {/* Google Login */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            size="large"
                            width="100%"
                            text={isSignUp ? 'signup_with' : 'signin_with'}
                        />
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-8">
                    By continuing, you agree to Nutino&apos;s Terms of Service
                    and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
