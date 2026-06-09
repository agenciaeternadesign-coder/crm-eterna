import { useState } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Services from './pages/Services'
import Financial from './pages/Financial'
import Calendar from './pages/Calendar'
import Pipeline from './pages/Pipeline'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Team from './pages/Team'
import Formations from './pages/Formations'
import { TeamProvider } from './context/TeamContext'
import { FormationsProvider } from './context/FormationsContext'

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { loading } = useApp()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #fdf2f5 0%, #fef9f0 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
        <p className="text-sm text-slate-400">A carregar os teus dados...</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 lg:ml-64 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ── Demo expirado ────────────────────────────────────────────
function DemoExpiredScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #fdf2f5 0%, #fef9f0 100%)' }}>
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-6">⏰</div>
        <h1 className="text-2xl font-light mb-3" style={{ color: '#6B1A2A' }}>
          O teu período de demonstração terminou
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Esperamos que tenhas gostado do Eterna Beauty CRM.
          Para continuar a gerir o teu negócio, escolhe o plano que melhor se adapta a ti.
        </p>
        <a
          href="https://crm-landing-jade.vercel.app/#planos"
          className="inline-block px-8 py-4 rounded-xl text-white font-medium text-sm tracking-wide"
          style={{ background: 'linear-gradient(135deg, #6B1A2A, #C9A84C)' }}>
          Ver planos e preços →
        </a>
        <p className="text-xs text-slate-400 mt-6">
          Tens dúvidas? Fala connosco pelo WhatsApp.
        </p>
      </div>
    </div>
  )
}

// ── Banner contagem demo ─────────────────────────────────────
function DemoBanner({ expiresAt }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - new Date()
      if (diff <= 0) { setRemaining('0h 0m'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${h}h ${m}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [expiresAt])

  const diff = new Date(expiresAt) - new Date()
  const urgent = diff < 2 * 3600000

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium"
      style={{ background: urgent ? '#fef3c7' : '#f0fdf4', color: urgent ? '#92400e' : '#166534', borderBottom: `1px solid ${urgent ? '#fde68a' : '#bbf7d0'}` }}>
      <span>{urgent ? '⚠️' : '🎯'} Modo demonstração</span>
      <span style={{ opacity: .6 }}>·</span>
      <span>Expira em <strong>{remaining}</strong></span>
      <span style={{ opacity: .6 }}>·</span>
      <a href="https://crm-landing-jade.vercel.app/#planos"
        className="underline font-semibold" style={{ color: 'inherit' }}>
        Escolher plano
      </a>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #fdf2f5 0%, #fef9f0 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
        <p className="text-sm text-slate-400">A carregar...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  // Verificar demo expirado
  const meta = user.user_metadata || {}
  if (meta.plano === 'demo' && meta.expires_at) {
    if (new Date() > new Date(meta.expires_at)) {
      return <DemoExpiredScreen />
    }
    // Demo ainda ativo — envolver com banner
    return (
      <div className="flex flex-col h-screen">
        <DemoBanner expiresAt={meta.expires_at} />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <TeamProvider>
          <FormationsProvider>
          <Routes>
            {/* Rota pública */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/services" element={<Services />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/team" element={<Team />} />
              <Route path="/formations" element={<Formations />} />
            </Route>
          </Routes>
          </FormationsProvider>
          </TeamProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
