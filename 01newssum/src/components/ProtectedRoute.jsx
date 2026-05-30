import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component.
 *
 * - If auth is still loading → show a full-screen spinner
 * - If not authenticated → redirect to /login
 * - If authenticated but not onboarded → redirect to /onboard
 * - Otherwise → render children
 */
export default function ProtectedRoute({ children }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-dark-bg)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">
                        Loading Nutino...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user.onboarded) {
        return <Navigate to="/onboard" replace />;
    }

    return children;
}
