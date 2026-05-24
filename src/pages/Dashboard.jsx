import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, FolderKanban, TrendingUp, Wallet, ArrowUpRight, CalendarDays, CheckCircle2, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useApp } from '../context/AppContext'
import Badge from '../components/UI/Badge'

const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
const fmtShort = (v) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}k €`
  return `${v} €`
}

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  return (
    <Link to={to} className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { clients, projects, financial, events, pipeline, settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const activeClients = clients.filter(c => c.status === 'ativo').length
  const activeProjects = projects.filter(p => p.status === 'em_andamento').length

  const monthIncome = financial
    .filter(f => f.type === 'entrada' && f.status === 'pago' && f.date.startsWith(monthKey))
    .reduce((s, f) => s + f.amount, 0)

  const pipelineValue = pipeline
    .filter(p => !['fechado', 'perdido'].includes(p.stage))
    .reduce((s, p) => s + p.value, 0)

  const monthlyData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entries = financial.filter(f => f.date.startsWith(prefix))
      data.push({
        month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        entradas: entries.filter(f => f.type === 'entrada' && f.status === 'pago').reduce((s, f) => s + f.amount, 0),
        saidas: entries.filter(f => f.type === 'saida').reduce((s, f) => s + f.amount, 0),
      })
    }
    return data
  }, [financial])

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const todayStr = now.toISOString().split('T')[0]
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const statusColor = { em_andamento: '#f59e0b', concluido: '#10b981', a_fazer: '#94a3b8' }
  const eventTypeColor = { reuniao: '#3b82f6', prazo: '#ef4444', outro: '#8b5cf6' }
  const eventTypeLabel = { reuniao: 'Reunião', prazo: 'Prazo', outro: 'Outro' }

  const fmtDate = (d) => {
    const [y, m, day] = d.split('-')
    return `${day}/${m}`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-medium text-slate-700 mb-2">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.fill }}>{p.name === 'entradas' ? 'Entradas' : 'Saídas'}: {fmt(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {settings.welcomeMessage || 'Olá! Aqui está o resumo do seu negócio.'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {settings.systemName || settings.companyName || 'Meu CRM'}
          </p>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Clientes Ativos" value={activeClients} sub={`${clients.length} no total`} color="#3b82f6" to="/clients" />
        <StatCard icon={FolderKanban} label="Projetos Ativos" value={activeProjects} sub={`${projects.length} no total`} color={pc} to="/projects" />
        <StatCard icon={Wallet} label="Receita do Mês" value={fmt(monthIncome)} sub="pagamentos recebidos" color="#10b981" to="/financial" />
        <StatCard icon={TrendingUp} label="Pipeline Aberto" value={fmt(pipelineValue)} sub="em negociação" color="#f59e0b" to="/pipeline" />
      </div>

      {/* Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">Receitas vs Despesas</h3>
            <span className="text-xs text-slate-400">Últimos 6 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="entradas" fill="#10b981" name="entradas" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="saidas" fill="#f87171" name="saidas" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Entradas</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Saídas</span>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Próximos Eventos</h3>
            <Link to="/calendar" className="text-xs font-medium" style={{ color: pc }}>Ver agenda</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <CalendarDays size={28} strokeWidth={1.5} />
              <p className="text-xs mt-2">Nenhum evento próximo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: eventTypeColor[ev.type] || '#8b5cf6' }}
                  >
                    <span className="text-xs font-bold leading-none">{fmtDate(ev.date).split('/')[0]}</span>
                    <span className="text-[9px] leading-none opacity-80">{fmtDate(ev.date).split('/')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{ev.title}</p>
                    <p className="text-xs text-slate-400">{eventTypeLabel[ev.type]}{ev.time ? ` · ${ev.time}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Projetos Recentes</h3>
          <Link to="/projects" className="text-xs font-medium" style={{ color: pc }}>Ver todos</Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-400">
            <FolderKanban size={28} strokeWidth={1.5} />
            <p className="text-xs mt-2">Nenhum projeto ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentProjects.map(project => {
              const client = clients.find(c => c.id === project.clientId)
              return (
                <div key={project.id} className="py-3 flex items-center gap-4">
                  <div
                    className="w-1.5 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusColor[project.status] || '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{project.name}</p>
                    <p className="text-xs text-slate-400 truncate">{client?.company || client?.name || '—'}</p>
                  </div>
                  <Badge type={project.status} />
                  {project.dueDate && (
                    <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1 flex-shrink-0">
                      <Clock size={12} />
                      {project.dueDate.split('-').reverse().join('/')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
