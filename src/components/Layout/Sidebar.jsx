import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderKanban, Wallet,
  CalendarDays, TrendingUp, Settings, X,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/clients', icon: Users, label: 'Clientes' },
  { path: '/projects', icon: FolderKanban, label: 'Projetos' },
  { path: '/financial', icon: Wallet, label: 'Financeiro' },
  { path: '/calendar', icon: CalendarDays, label: 'Agenda' },
  { path: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'
  const sc = settings.secondaryColor || '#EC4899'

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
      isActive ? 'font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
    }`

  const linkStyle = (isActive) =>
    isActive ? { backgroundColor: `${pc}18`, color: pc } : {}

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-9 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: pc }}
                >
                  {(settings.companyName || 'E').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate leading-tight">
                    {settings.companyName || 'Meu Negócio'}
                  </p>
                  {settings.segment && (
                    <p className="text-[10px] text-slate-400 truncate">{settings.segment}</p>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) => linkClass(isActive)}
              style={({ isActive }) => linkStyle(isActive)}
            >
              <Icon size={19} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Settings / Brand at bottom */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => linkClass(isActive)}
            style={({ isActive }) => isActive ? { backgroundColor: `${sc}18`, color: sc } : {}}
          >
            <Settings size={19} className="flex-shrink-0" />
            <span>Personalizar Marca</span>
          </NavLink>
        </div>
      </aside>
    </>
  )
}
