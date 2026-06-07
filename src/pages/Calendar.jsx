import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Clock,
  MessageCircle, User, Scissors, Euro, CheckCircle2, XCircle,
  AlertCircle, Send,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'

// ── Constantes ─────────────────────────────────────────────
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const M_STATUS = {
  confirmada:     { label: 'Confirmada',     color: '#10b981', bg: '#ecfdf5' },
  pendente:       { label: 'Pendente',       color: '#f59e0b', bg: '#fffbeb' },
  concluida:      { label: 'Concluída',      color: '#6366f1', bg: '#eef2ff' },
  cancelada:      { label: 'Cancelada',      color: '#ef4444', bg: '#fef2f2' },
  nao_compareceu: { label: 'Faltou',         color: '#94a3b8', bg: '#f1f5f9' },
}

const EV_COLOR = { reuniao: '#3b82f6', prazo: '#ef4444', formacao: '#8b5cf6', outro: '#64748b' }
const EV_LABEL = { reuniao: 'Reunião', prazo: 'Prazo', formacao: 'Formação', outro: 'Outro' }

const LS_KEY = 'crm_agenda_v2'

// ── Utilitários ─────────────────────────────────────────────
const loadData  = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const saveData  = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d))
const uid       = () => crypto.randomUUID()

const toStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const fmtDateLong = (s) => {
  if (!s) return ''
  const [y,m,d] = s.split('-')
  return new Date(+y, m-1, +d).toLocaleDateString('pt-PT', { weekday:'long', day:'numeric', month:'long' })
}
const fmtDateShort = (s) => {
  if (!s) return ''
  const [y,m,d] = s.split('-')
  return new Date(+y, m-1, +d).toLocaleDateString('pt-PT', { day:'numeric', month:'long' })
}
const fmt = (v) => v ? new Intl.NumberFormat('pt-PT',{ style:'currency', currency:'EUR' }).format(+v) : ''

// ── WhatsApp ────────────────────────────────────────────────
const cleanPhone  = (p='') => p.replace(/\D/g,'')
const hasPhone    = (p)    => cleanPhone(p).length >= 8
const waUrl       = (phone, text) => `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(text)}`

const msgConfirm = (name, service, date, time) =>
`Olá ${name}! ✨

Confirmo a tua marcação:
📅 ${fmtDateShort(date)}
🕐 ${time || '—'}${service ? `\n💆 ${service}` : ''}

Qualquer dúvida estou aqui. Até já! 🌸`

const msgReminder = (name, service, date, time) =>
`Olá ${name}! 💫

Lembro-te da tua marcação de amanhã:
📅 ${fmtDateShort(date)}
🕐 ${time || '—'}${service ? `\n💆 ${service}` : ''}

Até amanhã! 💅`

// ── Grelha do calendário ────────────────────────────────────
function getDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i = firstDay-1; i >= 0; i--)
    cells.push({ date: new Date(year, month, -i), cur: false })
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ date: new Date(year, month, i), cur: true })
  const rem = 42 - cells.length
  for (let i = 1; i <= rem; i++)
    cells.push({ date: new Date(year, month+1, i), cur: false })
  return cells
}

// ── Forms em branco ─────────────────────────────────────────
const emptyMarcacao = {
  kind: 'marcacao', clientId: '', serviceName: '',
  date: '', time: '', duration: '', price: '', status: 'confirmada', notes: '',
}
const emptyEvento = {
  kind: 'evento', title: '', date: '', time: '', type: 'outro', notes: '',
}

// ════════════════════════════════════════════════════════════
export default function Calendar() {
  const { clients, projects, settings } = useApp()
  const pc = settings.primaryColor || '#D4547A'

  // ── Estado ────────────────────────────────────────────────
  const [entries, setEntries] = useState(loadData)
  const [view,    setView]    = useState('todos') // 'marcacoes' | 'todos'

  useEffect(() => saveData(entries), [entries])

  const now      = new Date()
  const todayStr = toStr(now)

  const [viewDate,    setViewDate]    = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(todayStr)

  const [modalKind,   setModalKind]   = useState(null) // 'marcacao' | 'evento' | null
  const [mForm,       setMForm]       = useState(emptyMarcacao)
  const [eForm,       setEForm]       = useState(emptyEvento)
  const [confirmDel,  setConfirmDel]  = useState(null)

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const cells = getDays(year, month)

  // Nomes únicos de serviços para o datalist
  const serviceNames = useMemo(() =>
    [...new Set(projects.map(p => p.name).filter(Boolean))].sort(),
    [projects]
  )

  // Entradas do dia seleccionado
  const dayEntries = useMemo(() =>
    entries
      .filter(e => e.date === selectedDay && (view === 'todos' || e.kind === 'marcacao'))
      .sort((a, b) => (a.time||'').localeCompare(b.time||'')),
    [entries, selectedDay, view]
  )

  // Entradas por data (para pontos na grelha)
  const byDate = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [entries])

  // ── Handlers ─────────────────────────────────────────────
  const openMarcacao = () => {
    setMForm({ ...emptyMarcacao, date: selectedDay })
    setModalKind('marcacao')
  }
  const openEvento = () => {
    setEForm({ ...emptyEvento, date: selectedDay })
    setModalKind('evento')
  }

  const saveMarcacao = () => {
    if (!mForm.clientId || !mForm.date) return
    const client = clients.find(c => c.id === mForm.clientId)
    const entry = {
      ...mForm,
      id: uid(),
      clientName: client?.name || '',
      clientPhone: client?.phone || '',
      price: mForm.price ? +mForm.price : 0,
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => [...prev, entry])
    setModalKind(null)
  }

  const saveEvento = () => {
    if (!eForm.title.trim() || !eForm.date) return
    setEntries(prev => [...prev, { ...eForm, id: uid(), createdAt: new Date().toISOString() }])
    setModalKind(null)
  }

  const updateStatus = (id, status) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    setConfirmDel(null)
  }

  const setM = (k) => (ev) => setMForm(f => ({ ...f, [k]: ev.target.value }))
  const setE = (k) => (ev) => setEForm(f => ({ ...f, [k]: ev.target.value }))

  // Selecionar serviço → preenche nome e preço
  const handleServiceSelect = (name) => {
    setMForm(f => ({ ...f, serviceName: name }))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ════════════════════════════════════════
            GRELHA DO CALENDÁRIO
        ════════════════════════════════════════ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">

          {/* Navegação */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h2>
            <div className="flex gap-1">
              <button onClick={() => setViewDate(new Date(year, month-1, 1))}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronLeft size={18}/></button>
              <button
                onClick={() => { setViewDate(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(todayStr) }}
                className="px-3 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-xl text-slate-500">
                Hoje
              </button>
              <button onClick={() => setViewDate(new Date(year, month+1, 1))}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Cabeçalho dias */}
          <div className="grid grid-cols-7 border-b border-slate-50">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-slate-400 py-2.5">{d}</div>)}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7">
            {cells.map(({ date, cur }, i) => {
              const ds      = toStr(date)
              const items   = byDate[ds] || []
              const isToday = ds === todayStr
              const isSel   = ds === selectedDay

              return (
                <button key={i} onClick={() => setSelectedDay(ds)}
                  className={`min-h-[72px] p-1.5 text-left border-b border-r border-slate-50 transition-colors hover:bg-slate-50 ${!cur ? 'opacity-30' : ''}`}>
                  <div className={`w-7 h-7 flex items-center justify-center text-sm rounded-full mb-1 ${isToday ? 'text-white font-bold' : isSel ? 'font-semibold' : 'text-slate-700'}`}
                    style={isToday ? { backgroundColor: pc } : isSel ? { backgroundColor:`${pc}18`, color: pc } : {}}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {items.slice(0,3).map(item => {
                      const color = item.kind === 'marcacao'
                        ? (M_STATUS[item.status]?.color || pc)
                        : (EV_COLOR[item.type] || '#64748b')
                      const label = item.kind === 'marcacao'
                        ? (item.serviceName || item.clientName || 'Marcação')
                        : item.title
                      return (
                        <div key={item.id}
                          className="text-[10px] leading-tight px-1.5 py-0.5 rounded text-white truncate font-medium"
                          style={{ backgroundColor: color }}>
                          {item.time ? `${item.time} ` : ''}{label}
                        </div>
                      )
                    })}
                    {items.length > 3 && <div className="text-[10px] text-slate-400 px-1">+{items.length-3}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════
            PAINEL LATERAL
        ════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">

          {/* Header do painel */}
          <div className="p-4 border-b border-slate-50">
            <p className="font-semibold text-slate-800 capitalize text-sm">{fmtDateLong(selectedDay)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{dayEntries.length} entrada{dayEntries.length !== 1 ? 's' : ''}</p>

            {/* Filtro */}
            <div className="flex gap-1 mt-3 bg-slate-50 p-1 rounded-xl">
              {[['todos','Todos'],['marcacoes','Marcações']].map(([v,l]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${view===v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Botões de acção */}
            <div className="flex gap-2 mt-3">
              <button onClick={openMarcacao}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-white hover:opacity-90"
                style={{ backgroundColor: pc }}>
                <Plus size={13}/> Marcação
              </button>
              <button onClick={openEvento}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Plus size={13}/> Evento
              </button>
            </div>
          </div>

          {/* Lista de entradas */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {dayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CalendarDays size={32} strokeWidth={1.5}/>
                <p className="text-xs mt-2">Nenhuma entrada neste dia</p>
                <button onClick={openMarcacao} className="mt-3 text-xs font-medium" style={{ color: pc }}>
                  + Nova Marcação
                </button>
              </div>
            ) : (
              dayEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  pc={pc}
                  onStatusChange={updateStatus}
                  onDelete={setConfirmDel}
                />
              ))
            )}
          </div>

          {/* Legenda */}
          <div className="p-3 border-t border-slate-50">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(M_STATUS).map(([k,{label,color}]) => (
                <div key={k} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MODAL — Nova Marcação
      ════════════════════════════════════════════════════ */}
      <Modal isOpen={modalKind === 'marcacao'} onClose={() => setModalKind(null)} title="Nova Marcação" size="sm">
        <div className="space-y-3">

          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cliente *</label>
            <select value={mForm.clientId} onChange={setM('clientId')}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
              <option value="">Selecionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>

          {/* Serviço — usa datalist com serviços existentes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Serviço</label>
            <input
              list="services-list"
              value={mForm.serviceName}
              onChange={e => handleServiceSelect(e.target.value)}
              placeholder="Selecionar ou escrever serviço..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
            />
            <datalist id="services-list">
              {serviceNames.map(n => <option key={n} value={n}/>)}
            </datalist>
            {serviceNames.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">{serviceNames.length} serviço{serviceNames.length!==1?'s':''} importados da aba Serviços</p>
            )}
          </div>

          {/* Data + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
              <input type="date" value={mForm.date} onChange={setM('date')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Horário</label>
              <input type="time" value={mForm.time} onChange={setM('time')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none"/>
            </div>
          </div>

          {/* Duração + Preço */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duração</label>
              <input value={mForm.duration} onChange={setM('duration')} placeholder="Ex: 1h30, 2h"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço (€)</label>
              <input type="number" min="0" step="0.01" value={mForm.price} onChange={setM('price')} placeholder="0,00"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none"/>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Estado</label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(M_STATUS).map(([k,{label,color}]) => (
                <button key={k} type="button"
                  onClick={() => setMForm(f => ({ ...f, status: k }))}
                  className="py-1.5 text-[11px] rounded-xl border font-medium transition-all"
                  style={mForm.status === k
                    ? { backgroundColor: color, color:'#fff', borderColor: color }
                    : { borderColor:'#e2e8f0', color:'#64748b' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
            <textarea value={mForm.notes} onChange={setM('notes')} rows={2}
              placeholder="Detalhes, preferências da cliente..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none"/>
          </div>

          {/* Aviso WhatsApp */}
          {mForm.clientId && (() => {
            const c = clients.find(cl => cl.id === mForm.clientId)
            if (!c?.phone || !hasPhone(c.phone)) return (
              <p className="text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                ⚠️ Esta cliente não tem telefone guardado — WhatsApp indisponível.
              </p>
            )
            return null
          })()}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalKind(null)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button onClick={saveMarcacao} disabled={!mForm.clientId || !mForm.date}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════
          MODAL — Novo Evento
      ════════════════════════════════════════════════════ */}
      <Modal isOpen={modalKind === 'evento'} onClose={() => setModalKind(null)} title="Novo Evento" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
            <input value={eForm.title} onChange={setE('title')} autoFocus placeholder="Ex: Reunião, Prazo entrega..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
              <input type="date" value={eForm.date} onChange={setE('date')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Horário</label>
              <input type="time" value={eForm.time} onChange={setE('time')}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(EV_LABEL).map(([k,l]) => (
                <button key={k} type="button" onClick={() => setEForm(f => ({ ...f, type: k }))}
                  className="py-1.5 text-[11px] rounded-xl border font-medium transition-all"
                  style={eForm.type===k ? { backgroundColor:EV_COLOR[k], color:'#fff', borderColor:EV_COLOR[k] }
                    : { borderColor:'#e2e8f0', color:'#64748b' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
            <textarea value={eForm.notes} onChange={setE('notes')} rows={2}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalKind(null)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={saveEvento} disabled={!eForm.title.trim() || !eForm.date}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}>Guardar</button>
          </div>
        </div>
      </Modal>

      {/* ── Modal eliminar ───────────────────────────────── */}
      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Eliminar" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Eliminar <strong>{confirmDel?.serviceName || confirmDel?.clientName || confirmDel?.title}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDel(null)}
              className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button onClick={() => deleteEntry(confirmDel.id)}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Componente card de cada entrada no painel
// ════════════════════════════════════════════════════════════
function EntryCard({ entry, pc, onStatusChange, onDelete }) {
  const isMarcacao = entry.kind === 'marcacao'

  if (isMarcacao) {
    const st       = M_STATUS[entry.status] || M_STATUS.pendente
    const phone    = entry.clientPhone || ''
    const hasPh    = hasPhone(phone)
    const service  = entry.serviceName || ''
    const date     = entry.date
    const time     = entry.time || ''

    return (
      <div className="rounded-xl border border-slate-100 overflow-hidden group">
        {/* Barra de cor status */}
        <div className="h-1 w-full" style={{ backgroundColor: st.color }}/>

        <div className="p-3">
          {/* Linha 1: serviço + delete */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {service && (
                <p className="text-sm font-semibold text-slate-800 truncate">{service}</p>
              )}
              <p className={`text-xs text-slate-500 flex items-center gap-1 ${service ? 'mt-0.5' : 'font-semibold text-slate-700'}`}>
                <User size={11}/> {entry.clientName}
              </p>
            </div>
            <button onClick={() => onDelete(entry)}
              className="p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
              <Trash2 size={12}/>
            </button>
          </div>

          {/* Info: hora, duração, preço */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
            {time && <span className="flex items-center gap-1"><Clock size={10}/>{time}</span>}
            {entry.duration && <span>{entry.duration}</span>}
            {entry.price > 0 && <span className="flex items-center gap-1"><Euro size={10}/>{new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(entry.price)}</span>}
          </div>

          {entry.notes && (
            <p className="text-[11px] text-slate-400 mt-1.5 italic line-clamp-2">{entry.notes}</p>
          )}

          {/* Status */}
          <div className="mt-2.5">
            <select
              value={entry.status}
              onChange={e => onStatusChange(entry.id, e.target.value)}
              className="w-full text-[11px] border rounded-lg px-2 py-1.5 focus:outline-none font-medium"
              style={{ borderColor: st.color, color: st.color, backgroundColor: st.bg }}
            >
              {Object.entries(M_STATUS).map(([k,{label}]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          {/* WhatsApp */}
          {hasPh && (
            <div className="flex gap-1.5 mt-2">
              <a
                href={waUrl(phone, msgConfirm(entry.clientName, service, date, time))}
                target="_blank" rel="noopener"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <Send size={11}/> Confirmação
              </a>
              <a
                href={waUrl(phone, msgReminder(entry.clientName, service, date, time))}
                target="_blank" rel="noopener"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium border"
                style={{ borderColor: '#25D366', color: '#25D366' }}
              >
                <MessageCircle size={11}/> Lembrete
              </a>
            </div>
          )}
          {!hasPh && (
            <p className="text-[10px] text-slate-300 mt-1.5 text-center">Sem telefone — WhatsApp indisponível</p>
          )}
        </div>
      </div>
    )
  }

  // ── Evento genérico ──────────────────────────────────────
  const color = EV_COLOR[entry.type] || '#64748b'
  return (
    <div className="rounded-xl border border-slate-100 p-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: color }}/>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{entry.title}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              {entry.time && <span className="flex items-center gap-1"><Clock size={10}/>{entry.time}</span>}
              <span style={{ color }}>{EV_LABEL[entry.type]}</span>
            </div>
            {entry.notes && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{entry.notes}</p>}
          </div>
        </div>
        <button onClick={() => onDelete(entry)}
          className="p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  )
}
