import { useLocation } from 'react-router-dom'
import { Menu, LogOut, Crown } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Clientes & Alunas',
  '/services': 'Serviços & Formações',
  '/financial': 'Financeiro',
  '/calendar': 'Agenda',
  '/pipeline': 'Pipeline de Vendas',
  '/settings': 'Personalização da Marca',
  '/admin': 'Painel Admin',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const { settings } = useApp()
  const { user, signOut, isAdmin } = useAuth()
  const title = pageTitles[location.pathname] || 'CRM'
  const pc = settings.primaryColor || '#D4547A'

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">
          {settings.systemName || 'CRM Eterna Beauty'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Avatar + email */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${pc}, #C9A96E)` }}
          >
            {isAdmin ? <Crown size={12} /> : (user?.email?.charAt(0).toUpperCase() || 'U')}
          </div>
          <span className="text-xs text-slate-600 font-medium max-w-[140px] truncate">
            {user?.email}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          title="Sair"
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
