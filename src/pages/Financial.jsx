import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'

const CATEGORIES_IN = ['Serviços de Design', 'Marketing Digital', 'Consultoria', 'Desenvolvimento Web', 'Outro']
const CATEGORIES_OUT = ['Software e Assinaturas', 'Infraestrutura', 'Marketing', 'Material', 'Serviços Terceiros', 'Educação e Cursos', 'Impostos', 'Outro']

const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
const fmtDate = (d) => d ? d.split('-').reverse().join('/') : '-'
const fmtShort = (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v

const emptyForm = {
  type: 'entrada', description: '', category: '',
  date: new Date().toISOString().split('T')[0],
  amount: '', status: 'pendente', clientId: '',
}

export default function Financial() {
  const { financial, clients, addEntry, updateEntry, deleteEntry, settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = financial.filter(f => {
    const matchSearch = !search || f.description.toLowerCase().includes(search.toLowerCase()) || f.category?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || f.type === filterType
    const matchStatus = filterStatus === 'todos' || f.status === filterStatus
    return matchSearch && matchType && matchStatus
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalIn = financial.filter(f => f.type === 'entrada' && f.status === 'pago').reduce((s, f) => s + f.amount, 0)
  const totalOut = financial.filter(f => f.type === 'saida').reduce((s, f) => s + f.amount, 0)
  const pendingIn = financial.filter(f => f.type === 'entrada' && f.status === 'pendente').reduce((s, f) => s + f.amount, 0)

  const monthlyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entries = financial.filter(f => f.date.startsWith(prefix))
      return {
        month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        entradas: entries.filter(f => f.type === 'entrada' && f.status === 'pago').reduce((s, f) => s + f.amount, 0),
        saidas: entries.filter(f => f.type === 'saida').reduce((s, f) => s + f.amount, 0),
      }
    })
  }, [financial])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (e) => { setEditing(e.id); setForm({ ...emptyForm, ...e, amount: String(e.amount) }); setModal(true) }

  const handleSave = () => {
    if (!form.description.trim() || !form.amount || !form.date) return
    const data = { ...form, amount: parseFloat(form.amount) }
    if (editing) updateEntry(editing, data)
    else addEntry(data)
    setModal(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.fill }}>{p.name === 'entradas' ? 'Entradas' : 'Saídas'}: {fmt(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ArrowUpCircle size={18} className="text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">Total Recebido</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalIn)}</p>
          {pendingIn > 0 && <p className="text-xs text-amber-500 mt-1">{fmt(pendingIn)} a receber</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <ArrowDownCircle size={18} className="text-red-500" />
            </div>
            <span className="text-sm text-slate-500">Total de Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{fmt(totalOut)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
              <TrendingUp size={18} style={{ color: pc }} />
            </div>
            <span className="text-sm text-slate-500">Saldo Líquido</span>
          </div>
          <p className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
            {fmt(totalIn - totalOut)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Fluxo Mensal</h3>
          <div className="flex gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Entradas</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />Saídas</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="saidas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-slate-50">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lançamento..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none">
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none">
              <option value="todos">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: pc }}>
              <Plus size={15} />
              Novo
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Wallet size={36} strokeWidth={1.5} />
            <p className="mt-3 font-medium text-sm">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 font-medium border-b border-slate-50">
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Categoria</th>
                  <th className="px-5 py-3 hidden md:table-cell">Data</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${entry.type === 'entrada' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{entry.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-500">{entry.category || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-500">{fmtDate(entry.date)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-semibold ${entry.type === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {entry.type === 'entrada' ? '+' : '-'}{fmt(entry.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <Badge type={entry.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(entry)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setConfirmDelete(entry)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Lançamento' : 'Novo Lançamento'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {['entrada', 'saida'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
                  className={`py-2.5 text-sm rounded-xl border transition-all font-medium ${form.type === t ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  style={form.type === t ? { backgroundColor: t === 'entrada' ? '#10b981' : '#ef4444' } : {}}
                >
                  {t === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição *</label>
            <input value={form.description} onChange={set('description')} placeholder="Ex: Projeto de Identidade Visual" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
              <select value={form.category} onChange={set('category')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="">Selecionar...</option>
                {(form.type === 'entrada' ? CATEGORIES_IN : CATEGORIES_OUT).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={set('date')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0,00" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago / Recebido</option>
              </select>
            </div>
          </div>
          {form.type === 'entrada' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Cliente (opcional)</label>
              <select value={form.clientId} onChange={set('clientId')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="">Nenhum</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={handleSave} disabled={!form.description.trim() || !form.amount || !form.date} className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: pc }}>
              {editing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Lançamento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Excluir <strong>{confirmDelete?.description}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={() => { deleteEntry(confirmDelete.id); setConfirmDelete(null) }} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
