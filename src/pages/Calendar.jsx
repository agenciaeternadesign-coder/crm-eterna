import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TYPE_COLOR = { atendimento: '#D4547A', formacao: '#8b5cf6', reuniao: '#3b82f6', prazo: '#ef4444', outro: '#f59e0b' }
const TYPE_LABEL = { atendimento: 'Atendimento', formacao: 'Formação', reuniao: 'Reunião', prazo: 'Prazo/Entrega', outro: 'Outro' }

const LS_KEY = 'crm_agenda_eventos'

const loadEvents = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

const emptyForm = {
  title: '', date: '', time: '', type: 'atendimento', clientId: '', notes: '',
}

function getDaysInView(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), current: false })
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
  const { clients, settings } = useApp()
  const pc = settings.primaryColor || '#D4547A'

  // Eventos guardados em localStorage
  const [events, setEvents] = useState(loadEvents)

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(events))
  }, [events])

  const now      = new Date()
  const todayStr = toStr(now)

  const [viewDate,    setViewDate]    = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(todayStr)
  const [modal,       setModal]       = useState(false)
  const [form,        setForm]        = useState(emptyForm)
  const [confirmDel,  setConfirmDel]  = useState(null)

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days  = getDaysInView(year, month)

  const eventsForDate   = (dateStr) => events.filter(e => e.date === dateStr)
  const selectedEvents  = eventsForDate(selectedDay)

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const openAdd = () => {
    setForm({ ...emptyForm, date: selectedDay })
    setModal(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return
    const ev = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setEvents(prev => [...prev, ev].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')))
    setModal(false)
  }

  const handleDelete = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setConfirmDel(null)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const fmtSelectedDay = () => {
    if (!selectedDay) return ''
    const [y, m, d] = selectedDay.split('-')
    return new Date(y, m - 1, d).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Grelha do calendário ──────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">

          {/* Navegação */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => { setViewDate(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(todayStr) }}
                className="px-3 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                Hoje
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-7 border-b border-slate-50">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2.5">{d}</div>
            ))}
          </div>

          {/* Células dos dias */}
          <div className="grid grid-cols-7">
            {days.map(({ date, current }, i) => {
              const dateStr   = toStr(date)
              const dayEvents = eventsForDate(dateStr)
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selectedDay

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`min-h-[72px] p-1.5 text-left border-b border-r border-slate-50 transition-colors hover:bg-slate-50 ${!current ? 'opacity-30' : ''}`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full mb-1 transition-all
                      ${isToday ? 'text-white font-bold' : isSelected ? 'font-semibold' : 'text-slate-700'}`}
                    style={isToday ? { backgroundColor: pc } : isSelected ? { backgroundColor: `${pc}18`, color: pc } : {}}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded text-white truncate font-medium"
                        style={{ backgroundColor: TYPE_COLOR[ev.type] || pc }}
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

        {/* ── Painel lateral do dia ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-800 capitalize">{fmtSelectedDay()}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:opacity-90"
              style={{ backgroundColor: pc }}
            >
              <Plus size={14} /> Evento
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
              selectedEvents
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .map(ev => {
                  const client = clients.find(c => c.id === ev.clientId)
                  return (
                    <div key={ev.id} className="p-3 rounded-xl border border-slate-100 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: TYPE_COLOR[ev.type] || pc }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{ev.title}</p>
                            {ev.time && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock size={11} /> {ev.time}
                              </p>
                            )}
                            <span
                              className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-medium"
                              style={{ backgroundColor: `${TYPE_COLOR[ev.type] || pc}18`, color: TYPE_COLOR[ev.type] || pc }}
                            >
                              {TYPE_LABEL[ev.type]}
                            </span>
                            {client && <p className="text-xs text-slate-400 mt-1">{client.name}</p>}
                            {ev.notes && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{ev.notes}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmDel(ev)}
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

          {/* Legenda */}
          <div className="pt-4 mt-4 border-t border-slate-50 space-y-2">
            {Object.entries(TYPE_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLOR[key] }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal: Novo Evento ─────────────────────────── */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Novo Evento" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
            <input
              value={form.title} onChange={set('title')} autoFocus
              placeholder="Ex: Aluna — Lash Design"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={set('date')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Horário</label>
              <input type="time" value={form.time} onChange={set('time')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: key }))}
                  className="py-2 text-xs rounded-xl border transition-all font-medium"
                  style={form.type === key
                    ? { backgroundColor: TYPE_COLOR[key], color: 'white', borderColor: TYPE_COLOR[key] }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cliente (opcional)</label>
            <select value={form.clientId} onChange={set('clientId')}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
              <option value="">Nenhum</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
            <textarea
              value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Detalhes do evento..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(false)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.date}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Confirmar eliminar ──────────────────── */}
      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Eliminar Evento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Eliminar o evento <strong>{confirmDel?.title}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDel(null)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button onClick={() => handleDelete(confirmDel.id)}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
