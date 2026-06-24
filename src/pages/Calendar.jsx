import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Clock, MessageCircle, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const TYPE_COLOR = { reuniao: '#3b82f6', prazo: '#ef4444', visita: '#10b981', outro: '#8b5cf6' }
const TYPE_LABEL = { reuniao: 'Reunião', prazo: 'Prazo/Entrega', visita: 'Visita p/ Orçamento', outro: 'Outro' }

const emptyForm = {
  title: '', date: '', time: '', type: 'reuniao', clientId: '', description: '',
  tratamento: 'Sra.', tipo_obra: '', hora_fim: '', morada: '',
}

function buildVisitaSMS(ev, client, settings) {
  const tratamento = ev.tratamento || 'Sra.'
  const nome = client?.name || ev.title || '—'
  const tipoObra = ev.tipo_obra || '—'
  const data = ev.date ? ev.date.split('-').reverse().join('/') : '—'
  const horaInicio = ev.time || '—'
  const horaFim = ev.hora_fim || '—'
  const morada = ev.morada || '—'
  const telefone = settings?.phone || '214 098 779'
  const waLink = settings?.whatsappLink || ''
  return `${tratamento} ${nome}! Está confirmada a visita para orçamento, para - ${tipoObra}, no dia ${data}, entre: ${horaInicio} e as ${horaFim}, na ${morada}.\nTeremos todo gosto em ajudar. Para qualquer esclarecimento adicional poderá contactar-nos através do número ${telefone} ou do whatsapp ${waLink}\nAté breve!`
}

function CopySMSButton({ ev, client, settings }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    const msg = buildVisitaSMS(ev, client, settings)
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-600 hover:bg-green-50'}`}>
      {copied ? <><Check size={11}/> Copiado!</> : <><MessageCircle size={11}/> Copiar SMS</>}
    </button>
  )
}

function getDaysInView(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, current: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), current: true })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), current: false })
  }
  return days
}

const toStr = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Calendar() {
  const { events, clients, addEvent, deleteEvent, settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'

  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(toStr(now))
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = getDaysInView(year, month)
  const todayStr = toStr(now)

  const eventsForDate = (dateStr) => events.filter(e => e.date === dateStr)
  const selectedEvents = eventsForDate(selectedDay)

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const openAdd = () => {
    setForm({ ...emptyForm, date: selectedDay })
    setModal(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return
    addEvent(form)
    setModal(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const fmtSelectedDay = () => {
    if (!selectedDay) return ''
    const [y, m, d] = selectedDay.split('-')
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => { setViewDate(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(todayStr) }}
                className="px-3 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                Hoje
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-50">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {days.map(({ date, current }, i) => {
              const dateStr = toStr(date)
              const dayEvents = eventsForDate(dateStr)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDay

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`min-h-[72px] p-1.5 text-left border-b border-r border-slate-50 transition-colors hover:bg-slate-50
                    ${!current ? 'opacity-30' : ''}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center text-sm rounded-full mb-1 transition-all
                    ${isToday ? 'text-white font-bold' : isSelected ? 'font-semibold text-slate-800' : 'text-slate-700'}`}
                    style={isToday ? { backgroundColor: pc } : isSelected ? { backgroundColor: `${pc}18`, color: pc } : {}}>
                    {date.getDate()}
                  </div>

                  {/* Event dots */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded text-white truncate font-medium"
                        style={{ backgroundColor: TYPE_COLOR[ev.type] || '#8b5cf6' }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} mais</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-800 capitalize">{fmtSelectedDay()}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:opacity-90"
              style={{ backgroundColor: pc }}
            >
              <Plus size={14} />
              Evento
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CalendarDays size={32} strokeWidth={1.5} />
                <p className="text-xs mt-2">Nenhum evento neste dia</p>
                <button onClick={openAdd} className="mt-3 text-xs font-medium" style={{ color: pc }}>
                  + Adicionar evento
                </button>
              </div>
            ) : (
              selectedEvents.map(ev => {
                const client = clients.find(c => c.id === ev.clientId)
                return (
                  <div key={ev.id} className="p-3 rounded-xl border border-slate-100 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: TYPE_COLOR[ev.type] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{ev.title}</p>
                          {ev.time && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={11} />
                              {ev.time}{ev.hora_fim ? ` – ${ev.hora_fim}` : ''}
                            </p>
                          )}
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-medium"
                            style={{ backgroundColor: `${TYPE_COLOR[ev.type]}18`, color: TYPE_COLOR[ev.type] }}>
                            {TYPE_LABEL[ev.type]}
                          </span>
                          {client && <p className="text-xs text-slate-400 mt-1">{client.company || client.name}</p>}
                          {ev.tipo_obra && <p className="text-xs text-slate-500 mt-0.5">Obra: {ev.tipo_obra}</p>}
                          {ev.morada && <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.morada}</p>}
                          {ev.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{ev.description}</p>}
                          {ev.type === 'visita' && (
                            <div className="mt-2">
                              <CopySMSButton ev={ev} client={client} settings={settings} />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(ev)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Legend */}
          <div className="pt-4 mt-4 border-t border-slate-50 space-y-2">
            {Object.entries(TYPE_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[key] }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Novo Evento" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
            <input value={form.title} onChange={set('title')} placeholder="Ex: Reunião com cliente" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={set('date')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Horário</label>
              <input type="time" value={form.time} onChange={set('time')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, type: key }))}
                  className={`py-2 text-xs rounded-xl border transition-all font-medium`}
                  style={form.type === key
                    ? { backgroundColor: TYPE_COLOR[key], color: 'white', borderColor: TYPE_COLOR[key] }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Visita extra fields */}
          {form.type === 'visita' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tratamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sra.', 'Sr.'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, tratamento: t }))}
                      className={`py-2 text-sm rounded-xl border transition-all font-medium ${form.tratamento === t ? 'text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      style={form.tratamento === t ? { backgroundColor: TYPE_COLOR.visita, borderColor: TYPE_COLOR.visita } : {}}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de Obra *</label>
                <input value={form.tipo_obra} onChange={set('tipo_obra')} placeholder="Ex: Remodelação de cozinha" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Hora de Fim</label>
                <input type="time" value={form.hora_fim} onChange={set('hora_fim')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Morada</label>
                <input value={form.morada} onChange={set('morada')} placeholder="Rua, número, cidade" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cliente (opcional)</label>
            <select value={form.clientId} onChange={set('clientId')} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
              <option value="">Nenhum</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Detalhes do evento..." className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={handleSave} disabled={!form.title.trim() || !form.date} className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: pc }}>
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Evento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Excluir <strong>{confirmDelete?.title}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={() => { deleteEvent(confirmDelete.id); setConfirmDelete(null) }} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
