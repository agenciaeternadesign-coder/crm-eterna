import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, Scissors, Clock, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'

const STATUS_ORDER = ['em_andamento', 'a_fazer', 'concluido']
const STATUS_LABELS = { em_andamento: 'Em Andamento', a_fazer: 'A Fazer', concluido: 'Concluído' }

const emptyForm = {
  clientId: '', name: '', description: '',
  status: 'a_fazer', tipo: 'servico', dueDate: '', responsible: '',
}

export default function Services() {
  const { projects, clients, addProject, updateProject, deleteProject, settings } = useApp()
  const pc = settings.primaryColor || '#D4547A'

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterClient, setFilterClient] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    const matchClient = filterClient === 'todos' || p.clientId === filterClient
    const matchTipo = filterTipo === 'todos' || p.tipo === filterTipo
    return matchSearch && matchStatus && matchClient && matchTipo
  })

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (p) => { setEditing(p.id); setForm({ ...emptyForm, ...p }); setModal(true) }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) updateProject(editing, form)
    else addProject(form)
    setModal(false)
  }

  const cycleStatus = (project) => {
    const order = ['a_fazer', 'em_andamento', 'concluido']
    const next = order[(order.indexOf(project.status) + 1) % order.length]
    updateProject(project.id, { status: next })
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const fmtDate = (d) => d ? d.split('-').reverse().join('/') : null
  const statusBarColor = { em_andamento: '#f59e0b', a_fazer: '#94a3b8', concluido: '#10b981' }
  const tipoColor = { servico: '#0ea5e9', formacao: '#f97316' }

  const countServico = projects.filter(p => p.tipo === 'servico').length
  const countFormacao = projects.filter(p => p.tipo === 'formacao').length

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Type filter chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { id: 'todos', label: `Todos (${projects.length})`, color: pc },
          { id: 'servico', label: `Serviços (${countServico})`, color: '#0ea5e9' },
          { id: 'formacao', label: `Formações (${countFormacao})`, color: '#f97316' },
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilterTipo(chip.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filterTipo === chip.id ? 'text-white border-transparent shadow-sm' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'}`}
            style={filterTipo === chip.id ? { backgroundColor: chip.color } : {}}
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
            placeholder="Buscar serviços e formações..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none">
            <option value="todos">Todos os Status</option>
            <option value="a_fazer">A Fazer</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
          </select>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none">
            <option value="todos">Todos os Contactos</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
          </select>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: pc }}
          >
            <Plus size={16} />
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} serviço{filtered.length !== 1 ? 's' : ''}</p>

      {/* Grouped by status */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Scissors size={40} strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum serviço encontrado</p>
          <p className="text-sm mt-1">Adicione ou ajuste os filtros</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: pc }}>
            Criar Serviço
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map(status => {
            const group = filtered.filter(p => p.status === status)
            if (group.length === 0) return null
            return (
              <div key={status}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusBarColor[status] }} />
                  <h3 className="text-sm font-semibold text-slate-600">{STATUS_LABELS[status]}</h3>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{group.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.map(project => {
                    const client = clients.find(c => c.id === project.clientId)
                    const isOverdue = project.dueDate && project.dueDate < new Date().toISOString().split('T')[0] && project.status !== 'concluido'
                    return (
                      <div key={project.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-slate-800 text-sm leading-snug flex-1 pr-2">{project.name}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => openEdit(project)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setConfirmDelete(project)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {project.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>
                        )}

                        <div className="space-y-1.5 text-xs text-slate-400">
                          {client && (
                            <p className="flex items-center gap-1.5">
                              <User size={11} />
                              {client.company || client.name}
                              {client.tipo && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{ backgroundColor: client.tipo === 'aluna' ? '#8b5cf618' : '#3b82f618', color: client.tipo === 'aluna' ? '#7c3aed' : '#2563eb' }}>
                                  {client.tipo === 'aluna' ? 'Aluna' : 'Cliente'}
                                </span>
                              )}
                            </p>
                          )}
                          {project.dueDate && (
                            <p className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                              <Clock size={11} />
                              {isOverdue ? 'Atrasado · ' : ''}Prazo: {fmtDate(project.dueDate)}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                          <Badge type={project.tipo || 'servico'} />
                          <button
                            onClick={() => cycleStatus(project)}
                            className="text-xs font-medium px-3 py-1 rounded-lg transition-all hover:opacity-80"
                            style={{ backgroundColor: `${statusBarColor[status]}20`, color: statusBarColor[status] }}
                          >
                            Avançar →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Serviço' : 'Novo Serviço'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'servico', label: '✂️ Serviço', color: '#0ea5e9' },
                { id: 'formacao', label: '🎓 Formação', color: '#f97316' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t.id }))}
                  className={`py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${form.tipo === t.id ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  style={form.tipo === t.id ? { backgroundColor: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome do Serviço *</label>
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="Ex: Formação Esteticista Avançada"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Contacto Vinculado</label>
            <select value={form.clientId} onChange={set('clientId')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
              <option value="">Nenhum contacto vinculado</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Detalhes do serviço ou formação..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                <option value="a_fazer">A Fazer</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Prazo / Data</label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Responsável</label>
            <input
              value={form.responsible}
              onChange={set('responsible')}
              placeholder="Nome do responsável"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: tipoColor[form.tipo] || pc }}
            >
              {editing ? 'Salvar Alterações' : 'Criar Serviço'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Serviço" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Excluir <strong>{confirmDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button
              onClick={() => { deleteProject(confirmDelete.id); setConfirmDelete(null) }}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
