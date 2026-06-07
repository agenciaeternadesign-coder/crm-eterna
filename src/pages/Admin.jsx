import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import {
  Users, Wallet, TrendingUp, Scissors,
  Crown, ArrowUpRight, ArrowDownRight, CalendarDays,
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  const isUp = trend >= 0
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Admin() {
  const { isAdmin, user } = useAuth()
  const { clients, projects, financial, pipeline, events } = useApp()

  // Apenas admin tem acesso
  if (!isAdmin) return <Navigate to="/" replace />

  // ── Métricas ──────────────────────────────────────────────
  const totalClients    = clients.length
  const activeClients   = clients.filter(c => c.status === 'ativo').length
  const totalAlunas     = clients.filter(c => c.tipo === 'aluna').length

  const receita         = financial.filter(f => f.type === 'entrada' && f.status === 'pago').reduce((s, f) => s + f.amount, 0)
  const pendente        = financial.filter(f => f.type === 'entrada' && f.status === 'pendente').reduce((s, f) => s + f.amount, 0)
  const despesas        = financial.filter(f => f.type === 'saida').reduce((s, f) => s + f.amount, 0)
  const lucro           = receita - despesas

  const totalServicos   = projects.length
  const concluidos      = projects.filter(p => p.status === 'concluido').length
  const emAndamento     = projects.filter(p => p.status === 'em_andamento').length

  const pipelineValor   = pipeline.reduce((s, p) => s + (p.value || 0), 0)
  const pipelineGanhos  = pipeline.filter(p => ['c_fidelizada', 'a_inscrita', 'a_concluida'].includes(p.stage)).reduce((s, p) => s + (p.value || 0), 0)

  const agendaHoje      = events.filter(e => e.date === new Date().toISOString().split('T')[0]).length

  const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  // Top clientes por receita
  const topClients = clients
    .map(c => ({
      ...c,
      receita: financial.filter(f => f.clientId === c.id && f.type === 'entrada' && f.status === 'pago').reduce((s, f) => s + f.amount, 0),
    }))
    .filter(c => c.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5)

  // Categorias de receita
  const categorias = financial
    .filter(f => f.type === 'entrada' && f.status === 'pago')
    .reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + f.amount
      return acc
    }, {})
  const catSorted = Object.entries(categorias).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #D4547A, #C9A96E)' }}>
          <Crown size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Painel Admin</h2>
          <p className="text-xs text-slate-400">{user?.email} · Acesso total</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Clientes Activos"   value={activeClients}   sub={`${totalClients} total · ${totalAlunas} alunas`}   color="#D4547A" trend={12} />
        <StatCard icon={Wallet}      label="Receita Confirmada" value={fmt(receita)}    sub={`Pendente: ${fmt(pendente)}`}                        color="#C9A96E" trend={8}  />
        <StatCard icon={TrendingUp}  label="Lucro Líquido"      value={fmt(lucro)}      sub={`Despesas: ${fmt(despesas)}`}                        color="#10b981" trend={lucro > 0 ? 5 : -5} />
        <StatCard icon={Scissors}    label="Serviços"           value={totalServicos}   sub={`${emAndamento} a decorrer · ${concluidos} concl.`}  color="#8b5cf6" trend={3}  />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}    label="Pipeline Total"    value={fmt(pipelineValor)}  sub={`${fmt(pipelineGanhos)} convertidos`} color="#f97316" />
        <StatCard icon={CalendarDays}  label="Eventos Hoje"      value={agendaHoje}          sub={`${events.length} total na agenda`}   color="#0ea5e9" />
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Taxa de Conclusão</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-slate-800">
              {totalServicos > 0 ? Math.round((concluidos / totalServicos) * 100) : 0}%
            </span>
            <span className="text-sm text-slate-400 mb-0.5">dos serviços concluídos</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${totalServicos > 0 ? (concluidos / totalServicos) * 100 : 0}%`, background: 'linear-gradient(90deg, #D4547A, #C9A96E)' }}
            />
          </div>
        </div>
      </div>

      {/* Tabelas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Clientes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Clientes por Receita</h3>
          {topClients.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sem dados ainda</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-slate-400">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#D4547A' }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.company || c.segment || '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{fmt(c.receita)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receita por Categoria */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Receita por Categoria</h3>
          {catSorted.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sem dados ainda</p>
          ) : (
            <div className="space-y-3">
              {catSorted.map(([cat, val]) => {
                const pct = receita > 0 ? (val / receita) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium truncate flex-1 mr-2">{cat}</span>
                      <span className="text-slate-500 flex-shrink-0">{fmt(val)} · {Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #D4547A, #C9A96E)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
