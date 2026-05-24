import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Pencil, Trash2, TrendingUp, Users, GraduationCap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'

const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)

const STAGES_CLIENTE = [
  { id: 'c_lead', label: 'Lead', color: '#64748b' },
  { id: 'c_contato', label: 'Contacto', color: '#3b82f6' },
  { id: 'c_agendamento', label: 'Agendamento', color: '#8b5cf6' },
  { id: 'c_atendida', label: 'Atendida', color: '#f59e0b' },
  { id: 'c_fidelizada', label: 'Fidelizada', color: '#10b981' },
  { id: 'c_perdida', label: 'Perdida', color: '#ef4444' },
]

const STAGES_ALUNA = [
  { id: 'a_lead', label: 'Lead', color: '#64748b' },
  { id: 'a_interessada', label: 'Interessada', color: '#3b82f6' },
  { id: 'a_proposta', label: 'Proposta Enviada', color: '#8b5cf6' },
  { id: 'a_inscrita', label: 'Inscrita', color: '#f59e0b' },
  { id: 'a_concluida', label: 'Formação Concluída', color: '#10b981' },
  { id: 'a_desistiu', label: 'Desistiu', color: '#ef4444' },
]

const WON = { cliente: 'c_fidelizada', aluna: 'a_concluida' }
const LOST = { cliente: 'c_perdida', aluna: 'a_desistiu' }

const emptyForm = { title: '', clientName: '', value: '', stage: 'c_lead', tipo: 'cliente', notes: '' }

export default function Pipeline() {
  const { pipeline, addPipelineCard, updatePipelineCard, deletePipelineCard, settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'

  const [mode, setMode] = useState('cliente')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const stages = mode === 'cliente' ? STAGES_CLIENTE : STAGES_ALUNA
  const cards = pipeline.filter(p => p.tipo === mode)

  const activeCards = cards.filter(p => p.stage !== WON[mode] && p.stage !== LOST[mode])
  const wonCards = cards.filter(p => p.stage === WON[mode])

  const totalActive = activeCards.reduce((s, p) => s + p.value, 0)
  const totalWon = wonCards.reduce((s, p) => s + p.value, 0)

  const handleDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    updatePipelineCard(draggableId, { stage: destination.droppableId })
  }

  const openAdd = (stage) => {
    const defaultStage = stage || (mode === 'cliente' ? 'c_lead' : 'a_lead')
    setEditing(null)
    setForm({ ...emptyForm, tipo: mode, stage: defaultStage })
    setModal(true)
  }

  const openEdit = (card) => {
    setEditing(card.id)
    setForm({ ...emptyForm, ...card, value: String(card.value) })
    setModal(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.clientName.trim() || !form.value) return
    const data = { ...form, value: parseFloat(form.value) }
    if (editing) updatePipelineCard(editing, data)
    else addPipelineCard(data)
    setModal(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-full space-y-5">
      {/* Mode toggle + summary */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode toggle */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode('cliente')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'cliente' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={mode === 'cliente' ? { backgroundColor: '#3b82f6' } : {}}
          >
            <Users size={16} />
            Clientes
          </button>
          <button
            onClick={() => setMode('aluna')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'aluna' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={mode === 'aluna' ? { backgroundColor: '#8b5cf6' } : {}}
          >
            <GraduationCap size={16} />
            Alunas
          </button>
        </div>

        {/* Summary cards */}
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
              <TrendingUp size={16} style={{ color: pc }} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Em Aberto</p>
              <p className="font-bold text-slate-800 text-sm">{fmt(totalActive)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="text-emerald-600 text-xs font-bold">✓</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">{mode === 'cliente' ? 'Fidelizadas' : 'Concluídas'}</p>
              <p className="font-bold text-emerald-600 text-sm">{fmt(totalWon)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <span className="text-slate-500 text-xs font-bold">{cards.length}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total de Cards</p>
              <p className="font-bold text-slate-800 text-sm">{activeCards.length} ativas</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: mode === 'cliente' ? '#3b82f6' : '#8b5cf6' }}
        >
          <Plus size={16} />
          Novo Card
        </button>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageCards = cards.filter(p => p.stage === stage.id)
            const stageValue = stageCards.reduce((s, p) => s + p.value, 0)

            return (
              <div key={stage.id} className="flex-shrink-0 w-68" style={{ minWidth: '268px' }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{stageCards.length}</span>
                  </div>
                  <button onClick={() => openAdd(stage.id)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <Plus size={15} />
                  </button>
                </div>
                {stageValue > 0 && (
                  <p className="text-xs text-slate-400 px-1 mb-2 font-medium">{fmt(stageValue)}</p>
                )}

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-24 rounded-2xl transition-colors p-2 space-y-2 ${snapshot.isDraggingOver ? 'bg-slate-100' : 'bg-slate-50/50'}`}
                    >
                      {stageCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border p-3.5 group transition-all ${snapshot.isDragging ? 'shadow-lg border-slate-200 rotate-1' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-semibold text-slate-800 leading-snug flex-1 pr-2">{card.title}</p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button onClick={() => openEdit(card)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                                    <Pencil size={12} />
                                  </button>
                                  <button onClick={() => setConfirmDelete(card)} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-slate-500 mb-3">{card.clientName}</p>

                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                  style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                                >
                                  {fmt(card.value)}
                                </span>
                              </div>

                              {card.notes && (
                                <p className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-50 line-clamp-2">
                                  {card.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {stageCards.length === 0 && (
                        <button
                          onClick={() => openAdd(stage.id)}
                          className="w-full py-6 text-xs text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-xl transition-colors border-2 border-dashed border-slate-100 hover:border-slate-200"
                        >
                          + Adicionar
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Card' : `Novo Card — ${mode === 'cliente' ? 'Cliente' : 'Aluna'}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
            <input value={form.title} onChange={set('title')} placeholder={mode === 'cliente' ? 'Ex: Branding Completo' : 'Ex: Formação Esteticista Avançada'} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{mode === 'cliente' ? 'Cliente / Empresa' : 'Nome da Aluna'} *</label>
            <input value={form.clientName} onChange={set('clientName')} placeholder="Nome completo" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (€) *</label>
              <input type="number" min="0" step="10" value={form.value} onChange={set('value')} placeholder="0" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Etapa</label>
              <select value={form.stage} onChange={set('stage')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Observações, próximos passos..." className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.clientName.trim() || !form.value}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: mode === 'cliente' ? '#3b82f6' : '#8b5cf6' }}
            >
              {editing ? 'Salvar' : 'Criar Card'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Card" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Excluir <strong>{confirmDelete?.title}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={() => { deletePipelineCard(confirmDelete.id); setConfirmDelete(null) }} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
