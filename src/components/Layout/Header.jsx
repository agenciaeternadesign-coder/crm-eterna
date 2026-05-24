import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Clientes',
  '/projects': 'Projetos',
  '/financial': 'Financeiro',
  '/calendar': 'Agenda',
  '/pipeline': 'Pipeline de Vendas',
  '/settings': 'Personalização da Marca',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const { settings } = useApp()
  const title = pageTitles[location.pathname] || 'CRM'
  const pc = settings.primaryColor || '#7C3AED'

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
          {settings.systemName || settings.companyName || 'Meu CRM'}
        </p>
      </div>

      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
        style={{ backgroundColor: pc }}
      >
        {(settings.companyName || 'E').charAt(0).toUpperCase()}
      </div>
    </header>
  )
}
