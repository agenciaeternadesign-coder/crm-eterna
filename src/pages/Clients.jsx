import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, Users, Mail, Phone, Building2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'

const SEGMENTS = [
  'Estética Facial', 'Estética Corporal', 'Nail Designer',
  'Cabeleireiro / Hair', 'Maquiagem Artística', 'Lash Designer',
  'Design de Sobrancelha', 'Dermopigmentação', 'Depilação',
  'Spa & Bem-estar', 'Noiva', 'Cliente Final', 'Outro',
]

const emptyForm = {
  name: '', company: '', email: '', phone: '',
  segment: '', status: 'ativo', tipo: 'cliente', notes: '',
}

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient, settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterSegment, setFilterSegment] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = clients.filter(c => {
    const matchSearch = !search || [c.name, c.company, c.email].some(s => s?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    const matchSegment = filterSegment === 'todos' || c.segment === filterSegment
    const matchTipo = filterTipo === 'todos' || c.tipo === filterTipo
    return matchSearch && matchStatus && matchSegment && matchTipo
  })

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (c) => { setEditing(c.id); setForm({ ...emptyForm, ...c }); setModal(true) }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) updateClient(editing, form)
    else addClient(form)
    setModal(false)
  }

  const handleDelete = (id) => { deleteClient(id); setConfirmDelete(null) }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const tipoConfig = {
    cliente: { label: 'Cliente', color: '#3b82f6' },
    aluna: { label: 'Aluna', color: '#8b5cf6' },
  }

  const countClientes = clients.filter(c => c.tipo === 'cliente').length
  const countAlunas = clients.filter(c => c.tipo === 'aluna').length

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Type summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { id: 'todos', label: `Todos (${clients.length})`, color: pc },
          { id: 'cliente', label: `Clientes (${countClientes})`, color: '#3b82f6' },
          { id: 'aluna', label: `Alunas (${countAlunas})`, color: '#8b5cf6' },
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilterTipo(chip.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filterTipo === chip.id ? 'text-white border-transparent shadow-sm' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'}`}
            style={filterTipo === chip.id ? { backgroundColor: chip.color, borderColor: chip.color } : {}}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, empresa ou e-mail..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none">
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none">
            <option value="todos">Todos os Segmentos</option>
            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: pc }}
          >
            <Plus size={16} />
            <span>Novo Contacto</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} contacto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={40} strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum contacto encontrado</p>
          <p className="text-sm mt-1">Adicione ou ajuste os filtros</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: pc }}>
            Adicionar Contacto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div key={client.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: tipoConfig[client.tipo]?.color || pc }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{client.name}</p>
                    {client.company && (
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Building2 size={11} />
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>
                <Badge type={client.status} />
              </div>

              <div className="space-y-1.5 mb-4">
                {client.email && (
                  <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                    <Mail size={12} className="flex-shrink-0" />
                    {client.email}
                  </p>
                )}
                {client.phone && (
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Phone size={12} className="flex-shrink-0" />
                    {client.phone}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <Badge type={client.tipo || 'cliente'} />
                  {client.segment && (
                    <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg">{client.segment}</span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(client)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(client)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Contacto' : 'Novo Contacto'} size="md">
        <div className="space-y-4">
          {/* Tipo toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Tipo de Contacto</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cliente', label: '👤 Cliente', color: '#3b82f6' },
                { id: 'aluna', label: '🎓 Aluna', color: '#8b5cf6' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t.id }))}
                  className={`py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${form.tipo === t.id ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  style={form.tipo === t.id ? { backgroundColor: t.color, borderColor: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome *</label>
              <input value={form.name} onChange={set('name')} placeholder="Nome completo" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Empresa</label>
              <input value={form.company} onChange={set('company')} placeholder="Nome da empresa (opcional)" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Segmento</label>
              <select value={form.segment} onChange={set('segment')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="">Selecionar...</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Notas sobre o contacto..." className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: tipoConfig[form.tipo]?.color || pc }}
            >
              {editing ? 'Salvar Alterações' : (form.tipo === 'aluna' ? 'Adicionar Aluna' : 'Adicionar Cliente')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Contacto" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Excluir <strong>{confirmDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
