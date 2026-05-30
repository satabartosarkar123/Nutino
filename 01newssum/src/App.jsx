import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import MySummaries from './pages/MySummaries'
import ArticleDetail from './components/ArticleDetail'
import Login from './pages/Login'
import Onboard from './pages/Onboard'

function AppLayout() {
  const location = useLocation()
  const hideNavbar = ['/login', '/onboard'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-[var(--color-dark-bg)] text-slate-100 selection:bg-brand-600 selection:text-white">
      {/* Background ambient light effects */}
      {!hideNavbar && (
        <>
          <div className="fixed top-[-10rem] left-[-10rem] w-[40rem] h-[40rem] bg-brand-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="fixed bottom-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        </>
      )}

      <div className="relative z-10">
        {!hideNavbar && <Navbar />}
        <main className={hideNavbar ? '' : 'pb-12 pt-6'}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboard" element={<Onboard />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summaries"
              element={
                <ProtectedRoute>
                  <MySummaries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/article"
              element={
                <ProtectedRoute>
                  <ArticleDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
