import { useState, useMemo } from 'react'
import {
  Plus, Search, Pencil, Trash2, GraduationCap, Users, Euro,
  CalendarDays, MapPin, Clock, Award, ChevronDown, X, Check,
  BookOpen, BadgeCheck,
} from 'lucide-react'
import { useFormations } from '../context/FormationsContext'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'

// ── Constantes ────────────────────────────────────────────
const CATEGORIES = [
  'Lash Design', 'Nail Design', 'Design de Sobrancelha',
  'Estética Facial', 'Estética Corporal', 'Dermopigmentação',
  'Maquiagem', 'Depilação', 'Cabeleireiro', 'Massagem', 'Outra',
]
const LOCATIONS   = ['Presencial', 'Online', 'Híbrido']
const F_STATUS    = { rascunho: 'Rascunho', ativa: 'Ativa', concluida: 'Concluída', cancelada: 'Cancelada' }
const S_STATUS    = { inscrita: 'Inscrita', confirmada: 'Confirmada', concluida: 'Concluída', cancelada: 'Cancelada' }

const F_STATUS_CLS = {
  rascunho:  'bg-slate-100 text-slate-500',
  ativa:     'bg-blue-50 text-blue-600',
  concluida: 'bg-emerald-50 text-emerald-600',
  cancelada: 'bg-red-50 text-red-500',
}
const S_STATUS_CLS = {
  inscrita:  'bg-blue-50 text-blue-600',
  confirmada:'bg-amber-50 text-amber-600',
  concluida: 'bg-emerald-50 text-emerald-600',
  cancelada: 'bg-red-50 text-red-500',
}

const fmt    = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0)
const fmtDay = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const emptyForm = {
  name: '', category: '', description: '', duration: '',
  price: '', maxStudents: '', date: '', endDate: '', time: '',
  location: 'Presencial', locationDetail: '', status: 'ativa',
}
const emptyStudent = { name: '', email: '', phone: '', notes: '' }

// ── Componentes auxiliares ─────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function FormationCard({ formation, students, onEdit, onDelete, onOpen, pc }) {
  const stds = students.filter(s => s.formationId === formation.id)
  const paid = stds.filter(s => s.paid)
  const revenue = paid.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0)
  const max = Number(formation.maxStudents) || 0
  const pct = max > 0 ? Math.min(100, Math.round((stds.length / max) * 100)) : null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${F_STATUS_CLS[formation.status]}`}>
              {F_STATUS[formation.status]}
            </span>
            {formation.category && (
              <span className="ml-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {formation.category}
              </span>
            )}
            <h3 className="font-semibold text-slate-800 text-sm leading-tight mt-1 truncate">
              {formation.name}
            </h3>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onEdit(formation)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-500 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(formation)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
          {formation.date && (
            <span className="flex items-center gap-1">
              <CalendarDays size={11} /> {fmtDay(formation.date)}
              {formation.endDate && formation.endDate !== formation.date && ` → ${fmtDay(formation.endDate)}`}
            </span>
          )}
          {formation.duration && (
            <span className="flex items-center gap-1"><Clock size={11} /> {formation.duration}</span>
          )}
          {formation.location && (
            <span className="flex items-center gap-1"><MapPin size={11} /> {formation.location}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">{stds.length}</p>
          <p className="text-[10px] text-slate-400">Alunas</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: paid.length > 0 ? '#10b981' : '#94a3b8' }}>
            {paid.length}
          </p>
          <p className="text-[10px] text-slate-400">Pagaram</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: pc }}>
            {stds.filter(s => s.certificateIssued).length}
          </p>
          <p className="text-[10px] text-slate-400">Certif.</p>
        </div>
      </div>

      {/* Progress bar (se tiver máximo) */}
      {pct !== null && (
        <div className="px-5 pb-3">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>{stds.length} / {max} vagas</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pc }} />
          </div>
        </div>
      )}

      {/* Price + CTA */}
      <div className="px-5 py-3.5 border-t border-slate-50 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Receita total</p>
          <p className="text-base font-bold text-emerald-600">{fmt(revenue)}</p>
        </div>
        {formation.price && (
          <p className="text-xs text-slate-400">{fmt(Number(formation.price))}/aluna</p>
        )}
        <button
          onClick={() => onOpen(formation)}
          className="px-4 py-2 rounded-xl text-xs font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: pc }}
        >
          Ver detalhes
        </button>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────
export default function Formations() {
  const { formations, students, addFormation, updateFormation, deleteFormation,
          addStudent, updateStudent, deleteStudent, getStudentsByFormation } = useFormations()
  const { settings } = useApp()
  const pc = settings.primaryColor || '#D4547A'

  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  // Modais
  const [formModal, setFormModal]       = useState(false)
  const [editing, setEditing]           = useState(null)
  const [form, setForm]                 = useState(emptyForm)

  const [detailFormation, setDetailFormation] = useState(null)
  const [detailTab, setDetailTab]             = useState('info')

  const [studentModal, setStudentModal] = useState(false)
  const [studentForm, setStudentForm]   = useState(emptyStudent)

  const [payModal, setPayModal]         = useState(null) // { student }
  const [payAmount, setPayAmount]       = useState('')

  const [confirmDelete, setConfirmDelete] = useState(null)

  // ── Filtro ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return formations.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.category?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'todos' || f.status === filterStatus
      return matchSearch && matchStatus
    }).sort((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt))
  }, [formations, search, filterStatus])

  // ── Stats globais ─────────────────────────────────────
  const totalRevenue  = students.filter(s => s.paid).reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0)
  const totalCertif   = students.filter(s => s.certificateIssued).length

  // ── Form handlers ─────────────────────────────────────
  const openAdd  = () => { setEditing(null); setForm(emptyForm); setFormModal(true) }
  const openEdit = (f) => { setEditing(f.id); setForm({ ...emptyForm, ...f }); setFormModal(true) }

  const handleSave = () => {
    if (!form.name.trim()) return
    const data = { ...form, price: form.price ? Number(form.price) : 0, maxStudents: form.maxStudents ? Number(form.maxStudents) : 0 }
    if (editing) updateFormation(editing, data)
    else addFormation(data)
    setFormModal(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Student handlers ──────────────────────────────────
  const handleAddStudent = () => {
    if (!studentForm.name.trim() || !detailFormation) return
    addStudent(detailFormation.id, studentForm)
    setStudentForm(emptyStudent)
    setStudentModal(false)
  }

  const handleMarkPaid = () => {
    if (!payModal || !payAmount) return
    updateStudent(payModal.id, {
      paid: true,
      paidAmount: parseFloat(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
    })
    setPayModal(null)
    setPayAmount('')
  }

  const handleUnpay = (id) => updateStudent(id, { paid: false, paidAmount: 0, paymentDate: '' })

  const handleCertificate = (id) =>
    updateStudent(id, { certificateIssued: true, certificateDate: new Date().toISOString().split('T')[0] })

  const handleRevokeCert = (id) =>
    updateStudent(id, { certificateIssued: false, certificateDate: '' })

  const handleStudentStatus = (id, status) => {
    updateStudent(id, { status })
    if (status === 'concluida') {
      const st = students.find(s => s.id === id)
      if (st && !st.certificateIssued) {
        // sugere emitir certificado – só actualiza status
      }
    }
  }

  // alunas da formação em detalhe
  const detailStudents = detailFormation ? getStudentsByFormation(detailFormation.id) : []

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Formações</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gere as tuas formações, alunas e certificados</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ backgroundColor: pc }}
        >
          <Plus size={16} /> Nova Formação
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}     label="Total de formações"  value={formations.length}     color="bg-blue-50 text-blue-500" />
        <StatCard icon={Users}        label="Total de alunas"      value={students.length}       color="bg-purple-50 text-purple-500" />
        <StatCard icon={Euro}         label="Receita total"        value={fmt(totalRevenue)}      color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={BadgeCheck}   label="Certificados emitidos" value={totalCertif}          color="bg-amber-50 text-amber-500" />
      </div>

      {/* ── Filtros ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar formações..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 bg-white"
          />
        </div>
        {['todos', 'rascunho', 'ativa', 'concluida', 'cancelada'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              filterStatus === s ? 'text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            style={filterStatus === s ? { backgroundColor: pc } : {}}
          >
            {s === 'todos' ? 'Todas' : F_STATUS[s]}
          </button>
        ))}
      </div>

      {/* ── Grid de formações ───────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <GraduationCap size={40} strokeWidth={1.5} />
          <p className="mt-3 font-medium text-slate-500">Nenhuma formação encontrada</p>
          <p className="text-sm mt-1">Cria a primeira formação para começar</p>
          <button onClick={openAdd} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: pc }}>
            + Nova Formação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(f => (
            <FormationCard
              key={f.id}
              formation={f}
              students={students}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
              onOpen={(f) => { setDetailFormation(f); setDetailTab('info') }}
              pc={pc}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL — Criar / Editar Formação
      ════════════════════════════════════════════════════ */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editing ? 'Editar Formação' : 'Nova Formação'} size="lg">
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome da formação *</label>
              <input value={form.name} onChange={set('name')} placeholder="Ex: Lash Designer Iniciante"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
              <select value={form.category} onChange={set('category')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="">Selecionar...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Estado</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                {Object.entries(F_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço por aluna (€)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Máx. de alunas</label>
              <input type="number" min="0" value={form.maxStudents} onChange={set('maxStudents')} placeholder="0 = sem limite"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de início</label>
              <input type="date" value={form.date} onChange={set('date')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de fim</label>
              <input type="date" value={form.endDate} onChange={set('endDate')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Horário</label>
              <input type="time" value={form.time} onChange={set('time')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duração</label>
              <input value={form.duration} onChange={set('duration')} placeholder="Ex: 8h, 2 dias, 3 semanas"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Local</label>
              <select value={form.location} onChange={set('location')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {form.location === 'Online' ? 'Link da sala' : 'Endereço / Sala'}
              </label>
              <input value={form.locationDetail} onChange={set('locationDetail')}
                placeholder={form.location === 'Online' ? 'https://zoom.us/...' : 'Rua, nº, cidade'}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
              <textarea value={form.description} onChange={set('description')} rows={3}
                placeholder="O que as alunas vão aprender, o que inclui (kit, material, certificado)..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setFormModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}>
              {editing ? 'Guardar alterações' : 'Criar formação'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════
          MODAL — Detalhe da Formação
      ════════════════════════════════════════════════════ */}
      {detailFormation && (
        <Modal
          isOpen={!!detailFormation}
          onClose={() => setDetailFormation(null)}
          title={detailFormation.name}
          size="xl"
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-slate-50 p-1 rounded-xl">
            {[
              { id: 'info',   label: 'Informações', icon: BookOpen },
              { id: 'alunas', label: `Alunas (${detailStudents.length})`, icon: Users },
              { id: 'certs',  label: 'Certificados', icon: Award },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDetailTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                  detailTab === id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Informações ─────────────────────────── */}
          {detailTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Categoria</p>
                  <p className="text-sm font-medium text-slate-700">{detailFormation.category || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Estado</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${F_STATUS_CLS[detailFormation.status]}`}>
                    {F_STATUS[detailFormation.status]}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Preço / aluna</p>
                  <p className="text-sm font-semibold text-emerald-600">{fmt(Number(detailFormation.price))}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Máx. alunas</p>
                  <p className="text-sm font-medium text-slate-700">{Number(detailFormation.maxStudents) > 0 ? detailFormation.maxStudents : 'Sem limite'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Data de início</p>
                  <p className="text-sm font-medium text-slate-700">{fmtDay(detailFormation.date)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Data de fim</p>
                  <p className="text-sm font-medium text-slate-700">{fmtDay(detailFormation.endDate)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Horário</p>
                  <p className="text-sm font-medium text-slate-700">{detailFormation.time || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Duração</p>
                  <p className="text-sm font-medium text-slate-700">{detailFormation.duration || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Local</p>
                  <p className="text-sm font-medium text-slate-700">{detailFormation.location || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Endereço / Link</p>
                  <p className="text-sm font-medium text-slate-700 break-all">{detailFormation.locationDetail || '—'}</p>
                </div>
              </div>
              {detailFormation.description && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Descrição</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{detailFormation.description}</p>
                </div>
              )}
              {/* Receita da formação */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700">Receita total desta formação</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                    {fmt(detailStudents.filter(s => s.paid).reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600">{detailStudents.filter(s => s.paid).length} de {detailStudents.length} pagaram</p>
                  <p className="text-xs text-emerald-500 mt-0.5">
                    Pendente: {fmt(detailStudents.filter(s => !s.paid).length * (Number(detailFormation.price) || 0))}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setDetailFormation(null); setTimeout(() => openEdit(detailFormation), 100) }}
                className="w-full py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium"
              >
                Editar informações da formação
              </button>
            </div>
          )}

          {/* ── Tab: Alunas ──────────────────────────────── */}
          {detailTab === 'alunas' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => { setStudentForm(emptyStudent); setStudentModal(true) }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: pc }}
                >
                  <Plus size={13} /> Adicionar aluna
                </button>
              </div>

              {detailStudents.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Users size={32} strokeWidth={1.5} />
                  <p className="text-sm mt-2">Nenhuma aluna inscrita ainda</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {detailStudents.map(st => (
                    <div key={st.id} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-700">{st.name}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${S_STATUS_CLS[st.status]}`}>
                              {S_STATUS[st.status]}
                            </span>
                            {st.certificateIssued && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                                <BadgeCheck size={10} /> Certificado
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                            {st.email && <span>{st.email}</span>}
                            {st.phone && <span>{st.phone}</span>}
                          </div>
                          {/* Pagamento */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {st.paid ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <Check size={12} /> {fmt(st.paidAmount)} pago{st.paymentDate ? ` em ${fmtDay(st.paymentDate)}` : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Pagamento pendente</span>
                            )}
                          </div>
                          {st.notes && <p className="text-xs text-slate-400 mt-1.5 italic">{st.notes}</p>}
                        </div>

                        {/* Acções */}
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          {/* Status */}
                          <select
                            value={st.status}
                            onChange={e => handleStudentStatus(st.id, e.target.value)}
                            className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-600 focus:outline-none"
                          >
                            {Object.entries(S_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>

                          {/* Pagamento */}
                          {!st.paid ? (
                            <button
                              onClick={() => { setPayModal(st); setPayAmount(String(detailFormation.price || '')) }}
                              className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100"
                            >
                              Marcar pago
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpay(st.id)}
                              className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium hover:bg-slate-200"
                            >
                              Remover pag.
                            </button>
                          )}

                          {/* Certificado */}
                          {!st.certificateIssued ? (
                            <button
                              onClick={() => handleCertificate(st.id)}
                              className="text-[10px] px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-medium hover:bg-amber-100"
                            >
                              Emitir cert.
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevokeCert(st.id)}
                              className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium hover:bg-slate-200"
                            >
                              Revogar cert.
                            </button>
                          )}

                          {/* Eliminar */}
                          <button
                            onClick={() => deleteStudent(st.id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-red-50 text-red-400 font-medium hover:bg-red-100"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Certificados ────────────────────────── */}
          {detailTab === 'certs' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
                <p className="font-medium mb-1 flex items-center gap-2"><Award size={14} /> Emissão de Certificados</p>
                <p className="text-xs text-amber-600">Marca as alunas que concluíram a formação e emite o certificado. A data de emissão é registada automaticamente.</p>
              </div>

              {detailStudents.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <Award size={32} strokeWidth={1.5} />
                  <p className="text-sm mt-2">Sem alunas inscritas</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {detailStudents.map(st => (
                    <div key={st.id} className={`rounded-xl p-4 border flex items-center justify-between gap-4 ${
                      st.certificateIssued ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{st.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Estado: <span className={`font-medium ${S_STATUS_CLS[st.status].split(' ')[1]}`}>{S_STATUS[st.status]}</span>
                        </p>
                        {st.certificateIssued && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <BadgeCheck size={11} /> Emitido em {fmtDay(st.certificateDate)}
                          </p>
                        )}
                      </div>
                      {!st.certificateIssued ? (
                        <button
                          onClick={() => handleCertificate(st.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:opacity-90 flex-shrink-0"
                          style={{ backgroundColor: pc }}
                        >
                          <Award size={13} /> Emitir certificado
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevokeCert(st.id)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 flex-shrink-0"
                        >
                          Revogar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal adicionar aluna ─────────────────────── */}
      <Modal isOpen={studentModal} onClose={() => setStudentModal(false)} title="Adicionar Aluna" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome *</label>
            <input value={studentForm.name} onChange={e => setStudentForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <input type="email" value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone / WhatsApp</label>
            <input value={studentForm.phone} onChange={e => setStudentForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+351 912 345 678"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações</label>
            <textarea value={studentForm.notes} onChange={e => setStudentForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Notas sobre a aluna..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setStudentModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={handleAddStudent} disabled={!studentForm.name.trim()}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}>
              Adicionar
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal marcar pagamento ─────────────────────── */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Registar Pagamento" size="sm">
        <div className="space-y-4">
          {payModal && (
            <>
              <p className="text-sm text-slate-600">Valor pago por <strong>{payModal.name}</strong>:</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (€) *</label>
                <input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00" autoFocus
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayModal(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
                <button onClick={handleMarkPaid} disabled={!payAmount}
                  className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40 bg-emerald-500">
                  Confirmar pagamento
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Modal confirmar apagar formação ───────────── */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Apagar Formação" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Tens a certeza que queres apagar <strong>{confirmDelete?.name}</strong>?<br />
            <span className="text-red-500">Todas as alunas e dados desta formação serão eliminados.</span>
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={() => { deleteFormation(confirmDelete.id); setConfirmDelete(null) }}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">
              Apagar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
