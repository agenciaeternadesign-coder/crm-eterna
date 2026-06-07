import { useState, useRef, useMemo } from 'react'
import {
  Plus, Search, Pencil, Trash2, Users, Phone, Mail, Calendar,
  ChevronLeft, ChevronRight, X, Upload, CheckCircle2, Clock,
  Briefcase, Percent, Banknote, AlertCircle, FileDown,
} from 'lucide-react'
import { useTeam } from '../context/TeamContext'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'

// ── Constantes ─────────────────────────────────────────
const PROFISSOES = [
  'Lash Designer', 'Nail Designer', 'Esteticista', 'Cabeleireira',
  'Dermopigmentadora', 'Maquiadora', 'Design de Sobrancelha',
  'Depiladora', 'Massagista', 'Outra',
]

const CONTRACT_LABELS = {
  aluguer_mesa: 'Aluguer de Mesa',
  comissao:     'Comissão',
  misto:        'Misto',
}
const CONTRACT_COLORS = {
  aluguer_mesa: { bg: '#3b82f618', color: '#2563eb' },
  comissao:     { bg: '#8b5cf618', color: '#7c3aed' },
  misto:        { bg: '#f59e0b18', color: '#d97706' },
}
const STATUS_COLORS = {
  ativa:    { bg: '#10b98118', color: '#059669', label: 'Ativa' },
  inativa:  { bg: '#94a3b818', color: '#64748b', label: 'Inativa' },
  licenca:  { bg: '#f9731618', color: '#ea580c', label: 'De Licença' },
}

const emptyForm = {
  name: '', photo: '', profession: '', startDate: '',
  contractType: 'comissao',
  deskValue: '', deskPayDay: '1',
  commissionPct: '', commissionBase: 'bruto',
  phone: '', email: '', nif: '',
  status: 'ativa', notes: '',
}

const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0)
const fmtDate = (d) => d ? d.split('-').reverse().join('/') : '—'
const monthLabel = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1).toLocaleString('pt-PT', { month: 'long', year: 'numeric' })
}

// ── Componente principal ────────────────────────────────
export default function Team() {
  const { members, production, payments, addMember, updateMember, deleteMember,
    addProduction, deleteProduction, getProductionByMember,
    markPayment, unmarkPayment, getPayment } = useTeam()
  const { settings } = useApp()
  const pc = settings.primaryColor || '#D4547A'

  // Filtros lista
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState('todos')
  const [filterContract, setFilterContract] = useState('todos')

  // Modais
  const [modal, setModal]               = useState(false)
  const [editing, setEditing]           = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [profileId, setProfileId]       = useState(null)
  const [fechoOpen, setFechoOpen]       = useState(false)

  // Mês do Fecho
  const now = new Date()
  const [fechoMonth, setFechoMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  // Tab do perfil
  const [profileTab, setProfileTab] = useState('dados')
  const [prodForm, setProdForm] = useState({ description: '', date: '', value: '', serviceId: '' })
  const [addProd, setAddProd] = useState(false)

  const photoRef = useRef()

  // ── Lista filtrada ─────────────────────────────────────
  const filtered = useMemo(() => members.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.profession?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || m.status === filterStatus
    const matchContract = filterContract === 'todos' || m.contractType === filterContract
    return matchSearch && matchStatus && matchContract
  }), [members, search, filterStatus, filterContract])

  const activeMemberCount = members.filter(m => m.status === 'ativa').length

  // ── Abrir / fechar modal add-edit ──────────────────────
  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (m) => { setEditing(m.id); setForm({ ...emptyForm, ...m }); setModal(true) }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) updateMember(editing, form)
    else addMember(form)
    setModal(false)
  }

  // ── Perfil ────────────────────────────────────────────
  const profileMember = members.find(m => m.id === profileId)
  const memberProduction = profileId ? getProductionByMember(profileId) : []
  const memberPayments = payments.filter(p => p.memberId === profileId)

  const handleAddProd = () => {
    if (!prodForm.description || !prodForm.date || !prodForm.value) return
    addProduction({ ...prodForm, memberId: profileId, value: parseFloat(prodForm.value) })
    setProdForm({ description: '', date: '', value: '', serviceId: '' })
    setAddProd(false)
  }

  // ── Cálculos Fecho do Mês ──────────────────────────────
  const fechoData = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'ativa')
    return activeMembers.map(m => {
      const prod = getProductionByMember(m.id, fechoMonth)
      const totalProd = prod.reduce((s, r) => s + (Number(r.value) || 0), 0)
      const commission = m.contractType !== 'aluguer_mesa'
        ? totalProd * ((Number(m.commissionPct) || 0) / 100)
        : 0
      const desk = m.contractType !== 'comissao'
        ? Number(m.deskValue) || 0
        : 0

      const deskPayment = getPayment(m.id, fechoMonth, 'aluguer')
      const commPayment = getPayment(m.id, fechoMonth, 'comissao')

      return { member: m, totalProd, commission, desk, deskPayment, commPayment }
    })
  }, [members, production, payments, fechoMonth])

  const totalAlugueres = fechoData.reduce((s, d) => s + d.desk, 0)
  const totalComissoes = fechoData.reduce((s, d) => s + d.commission, 0)

  const prevMonth = () => {
    const d = new Date(fechoMonth + '-01')
    d.setMonth(d.getMonth() - 1)
    setFechoMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const d = new Date(fechoMonth + '-01')
    d.setMonth(d.getMonth() + 1)
    setFechoMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ── Topo ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Equipa</h1>
          <p className="text-sm text-slate-500">{activeMemberCount} colaboradora{activeMemberCount !== 1 ? 's' : ''} ativa{activeMemberCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFechoOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <Banknote size={16} />
            Fecho do Mês
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: pc }}
          >
            <Plus size={16} />
            Nova Colaboradora
          </button>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou profissão..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none">
            <option value="todos">Todos os Estados</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
            <option value="licenca">De Licença</option>
          </select>
          <select value={filterContract} onChange={e => setFilterContract(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none">
            <option value="todos">Todos os Contratos</option>
            <option value="aluguer_mesa">Aluguer de Mesa</option>
            <option value="comissao">Comissão</option>
            <option value="misto">Misto</option>
          </select>
        </div>
      </div>

      {/* ── Lista ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={40} strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma colaboradora encontrada</p>
          <p className="text-sm mt-1">Adiciona a tua equipa para começar</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: pc }}>
            Adicionar Colaboradora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => {
            const sc = STATUS_COLORS[m.status] || STATUS_COLORS.ativa
            const cc = CONTRACT_COLORS[m.contractType] || CONTRACT_COLORS.comissao
            return (
              <div
                key={m.id}
                onClick={() => { setProfileId(m.id); setProfileTab('dados') }}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ backgroundColor: pc }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-500 truncate">{m.profession || '—'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={11} />
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ backgroundColor: cc.bg, color: cc.color }}>
                      {CONTRACT_LABELS[m.contractType]}
                    </span>
                    {m.contractType !== 'comissao' && m.deskValue &&
                      <span>{fmt(m.deskValue)}/mês</span>}
                    {m.contractType !== 'aluguer_mesa' && m.commissionPct &&
                      <span>{m.commissionPct}% comissão</span>}
                  </div>
                  {m.startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      Desde {fmtDate(m.startDate)}
                    </div>
                  )}
                  {m.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} /> {m.phone}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-xs text-slate-400">Ver perfil →</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(m)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(m)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL ADD / EDIT
      ══════════════════════════════════════════════════════ */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Colaboradora' : 'Nova Colaboradora'} size="lg">
        <div className="space-y-5">

          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors"
              onClick={() => photoRef.current?.click()}>
              {form.photo
                ? <img src={form.photo} alt="" className="w-full h-full object-cover" />
                : <Upload size={20} className="text-slate-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Foto da colaboradora</p>
              <p className="text-xs text-slate-400 mt-0.5">Clica para fazer upload (opcional)</p>
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Nome + Profissão */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome Completo *</label>
              <input value={form.name} onChange={set('name')} placeholder="Nome da colaboradora"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Profissão / Especialidade</label>
              <select value={form.profession} onChange={set('profession')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="">Selecionar...</option>
                {PROFISSOES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Tipo de Contrato */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Tipo de Contrato</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'aluguer_mesa', label: '🏠 Aluguer de Mesa' },
                { id: 'comissao',     label: '% Comissão' },
                { id: 'misto',        label: '⚡ Misto' },
              ].map(t => (
                <button key={t.id} type="button"
                  onClick={() => setForm(f => ({ ...f, contractType: t.id }))}
                  className={`py-2.5 text-xs rounded-xl border-2 font-medium transition-all ${form.contractType === t.id ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  style={form.contractType === t.id ? { backgroundColor: CONTRACT_COLORS[t.id].color } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campos condicionais: Aluguer */}
          {(form.contractType === 'aluguer_mesa' || form.contractType === 'misto') && (
            <div className="bg-blue-50/60 rounded-xl p-4 space-y-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">🏠 Aluguer de Mesa</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor Mensal (€)</label>
                  <input type="number" min="0" step="10" value={form.deskValue} onChange={set('deskValue')}
                    placeholder="0" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Dia de Pagamento</label>
                  <input type="number" min="1" max="31" value={form.deskPayDay} onChange={set('deskPayDay')}
                    placeholder="1" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
                </div>
              </div>
            </div>
          )}

          {/* Campos condicionais: Comissão */}
          {(form.contractType === 'comissao' || form.contractType === 'misto') && (
            <div className="bg-purple-50/60 rounded-xl p-4 space-y-3 border border-purple-100">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">% Comissão</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Percentagem (%)</label>
                  <input type="number" min="0" max="100" step="1" value={form.commissionPct} onChange={set('commissionPct')}
                    placeholder="30" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Base de Cálculo</label>
                  <select value={form.commissionBase} onChange={set('commissionBase')}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                    <option value="bruto">Valor Bruto</option>
                    <option value="liquido">Valor Líquido</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Data início + Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de Início</label>
              <input type="date" value={form.startDate} onChange={set('startDate')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Estado</label>
              <select value={form.status} onChange={set('status')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
                <option value="licenca">De Licença</option>
              </select>
            </div>
          </div>

          {/* Contactos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Telemóvel</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+351 912 345 678"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">NIF (opcional)</label>
              <input value={form.nif} onChange={set('nif')} placeholder="123 456 789"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas Livres</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Observações..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}>
              {editing ? 'Salvar Alterações' : 'Adicionar Colaboradora'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          MODAL PERFIL INDIVIDUAL
      ══════════════════════════════════════════════════════ */}
      <Modal isOpen={!!profileId} onClose={() => setProfileId(null)}
        title={profileMember?.name || 'Perfil'} size="lg">
        {profileMember && (
          <div className="space-y-4">
            {/* Header do perfil */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              {profileMember.photo ? (
                <img src={profileMember.photo} alt={profileMember.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                  style={{ backgroundColor: pc }}>
                  {profileMember.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{profileMember.name}</p>
                <p className="text-sm text-slate-500">{profileMember.profession || '—'}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: STATUS_COLORS[profileMember.status]?.bg, color: STATUS_COLORS[profileMember.status]?.color }}>
                    {STATUS_COLORS[profileMember.status]?.label}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: CONTRACT_COLORS[profileMember.contractType]?.bg, color: CONTRACT_COLORS[profileMember.contractType]?.color }}>
                    {CONTRACT_LABELS[profileMember.contractType]}
                  </span>
                </div>
              </div>
              <button onClick={() => { setProfileId(null); openEdit(profileMember) }}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                <Pencil size={15} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {[['dados', 'Dados'], ['producao', 'Produção'], ['pagamentos', 'Pagamentos']].map(([tab, label]) => (
                <button key={tab} onClick={() => setProfileTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${profileTab === tab ? 'border-current' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  style={profileTab === tab ? { color: pc, borderColor: pc } : {}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab: Dados */}
            {profileTab === 'dados' && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Data de Início', fmtDate(profileMember.startDate)],
                    ['Telemóvel', profileMember.phone || '—'],
                    ['Email', profileMember.email || '—'],
                    ['NIF', profileMember.nif || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-slate-700 text-sm truncate">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Contrato detalhe */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-slate-400 mb-1">Contrato</p>
                  {(profileMember.contractType === 'aluguer_mesa' || profileMember.contractType === 'misto') && (
                    <p className="text-sm text-slate-700">🏠 Aluguer: <strong>{fmt(profileMember.deskValue)}/mês</strong> · dia {profileMember.deskPayDay}</p>
                  )}
                  {(profileMember.contractType === 'comissao' || profileMember.contractType === 'misto') && (
                    <p className="text-sm text-slate-700">% Comissão: <strong>{profileMember.commissionPct}%</strong> sobre valor {profileMember.commissionBase}</p>
                  )}
                </div>

                {profileMember.notes && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Notas</p>
                    <p className="text-sm text-slate-600">{profileMember.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Produção */}
            {profileTab === 'producao' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Total: <strong>{fmt(memberProduction.reduce((s, r) => s + (Number(r.value) || 0), 0))}</strong>
                    <span className="text-slate-400 font-normal ml-1">({memberProduction.length} registos)</span>
                  </p>
                  <button onClick={() => setAddProd(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90"
                    style={{ backgroundColor: pc }}>
                    <Plus size={13} /> Novo Registo
                  </button>
                </div>

                {addProd && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-3 border border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={prodForm.description}
                        onChange={e => setProdForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Descrição do serviço"
                        className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                      <input type="date" value={prodForm.date}
                        onChange={e => setProdForm(f => ({ ...f, date: e.target.value }))}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                      <input type="number" value={prodForm.value}
                        onChange={e => setProdForm(f => ({ ...f, value: e.target.value }))}
                        placeholder="Valor €"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAddProd(false)}
                        className="flex-1 py-2 text-xs border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100">
                        Cancelar
                      </button>
                      <button onClick={handleAddProd}
                        className="flex-1 py-2 text-xs text-white rounded-xl font-medium hover:opacity-90"
                        style={{ backgroundColor: pc }}>
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {memberProduction.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Sem registos de produção ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {memberProduction.sort((a, b) => b.date > a.date ? 1 : -1).map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 group">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{r.description}</p>
                          <p className="text-xs text-slate-400">{fmtDate(r.date)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-700">{fmt(r.value)}</p>
                          <button onClick={() => deleteProduction(r.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Pagamentos */}
            {profileTab === 'pagamentos' && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {memberPayments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Sem histórico de pagamentos.</p>
                ) : (
                  memberPayments.sort((a, b) => b.month > a.month ? 1 : -1).map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 capitalize">{monthLabel(p.month)}</p>
                        <p className="text-xs text-slate-400">{p.type === 'aluguer' ? 'Aluguer de Mesa' : 'Comissão'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{fmt(p.amount)}</p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">Pago</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════
          MODAL FECHO DO MÊS
      ══════════════════════════════════════════════════════ */}
      <Modal isOpen={fechoOpen} onClose={() => setFechoOpen(false)} title="Fecho do Mês" size="lg">
        <div className="space-y-4">
          {/* Seletor de mês */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-slate-700 capitalize">{monthLabel(fechoMonth)}</p>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Resumo geral */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">A receber · Alugueres</p>
              <p className="text-lg font-bold text-blue-700">{fmt(totalAlugueres)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xs text-purple-600 font-medium mb-1">A pagar · Comissões</p>
              <p className="text-lg font-bold text-purple-700">{fmt(totalComissoes)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${totalAlugueres - totalComissoes >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-medium mb-1 ${totalAlugueres - totalComissoes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Saldo Líquido</p>
              <p className={`text-lg font-bold ${totalAlugueres - totalComissoes >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(totalAlugueres - totalComissoes)}</p>
            </div>
          </div>

          {/* Por colaboradora */}
          {fechoData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sem colaboradoras ativas.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fechoData.map(({ member: m, totalProd, commission, desk, deskPayment, commPayment }) => (
                <div key={m.id} className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {m.photo
                        ? <img src={m.photo} alt={m.name} className="w-9 h-9 rounded-xl object-cover" />
                        : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: pc }}>{m.name.charAt(0).toUpperCase()}</div>}
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{m.name}</p>
                        <p className="text-xs text-slate-400">{CONTRACT_LABELS[m.contractType]}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Produção: <strong className="text-slate-600">{fmt(totalProd)}</strong></p>
                  </div>

                  <div className="space-y-2">
                    {/* Aluguer */}
                    {desk > 0 && (
                      <div className="flex items-center justify-between bg-blue-50/70 rounded-lg p-2.5">
                        <div>
                          <p className="text-xs font-medium text-blue-700">🏠 Aluguer a receber</p>
                          <p className="text-xs text-blue-500">Dia {m.deskPayDay} do mês</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-blue-700">{fmt(desk)}</p>
                          {deskPayment?.status === 'pago' ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              <CheckCircle2 size={11} /> Pago
                            </span>
                          ) : (
                            <button
                              onClick={() => markPayment(m.id, fechoMonth, 'aluguer', desk)}
                              className="text-[11px] font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg transition-colors">
                              Marcar pago
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comissão */}
                    {(m.contractType === 'comissao' || m.contractType === 'misto') && (
                      <div className="flex items-center justify-between bg-purple-50/70 rounded-lg p-2.5">
                        <div>
                          <p className="text-xs font-medium text-purple-700">% Comissão a pagar</p>
                          <p className="text-xs text-purple-500">{m.commissionPct}% · {m.commissionBase}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-purple-700">{fmt(commission)}</p>
                          {commPayment?.status === 'pago' ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              <CheckCircle2 size={11} /> Pago
                            </span>
                          ) : (
                            <button
                              onClick={() => markPayment(m.id, fechoMonth, 'comissao', commission)}
                              className="text-[11px] font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-lg transition-colors">
                              Marcar pago
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {commission === 0 && desk === 0 && (
                      <p className="text-xs text-slate-400 text-center py-1">Sem valores configurados.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Confirmar Delete ──────────────────────────────── */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remover Colaboradora" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Remover <strong>{confirmDelete?.name}</strong>? Todos os registos de produção e pagamentos associados serão apagados. Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button onClick={() => { deleteMember(confirmDelete.id); setConfirmDelete(null) }}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">
              Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
