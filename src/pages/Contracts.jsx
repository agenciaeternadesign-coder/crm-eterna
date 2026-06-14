import { useState, useMemo } from 'react'
import {
  Plus, Search, FileText, Send, PenLine, Trash2, Eye,
  Printer, CheckCircle2, Clock, AlertCircle, X, ChevronDown,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'
import { generateContractHTML, buildPaymentDescription, buildPaymentSchedule } from '../data/contractTemplate'

const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v || 0)
const fmtDate = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
const todayStr = () => new Date().toISOString().split('T')[0]

const PAYMENT_METHODS = [
  { id: 'transferencia', label: 'Transferência' },
  { id: 'avista', label: 'À Vista' },
  { id: 'parcelado', label: 'Parcelado' },
]

const emptyForm = {
  clientId: '',
  clientName: '',
  clientNIF: '',
  clientAddress: '',
  clientEmail: '',
  clientPhone: '',
  serviceDescription: '',
  totalValue: '',
  contractDate: todayStr(),
  startDate: '',
  endDate: '',
  paymentMethod: 'transferencia',
  paymentDate: '',
  installments: '3',
  firstPaymentDate: '',
  notes: '',
}

export default function Contracts() {
  const { contracts, addContract, updateContract, deleteContract, clients, settings } = useApp()
  const pc = settings.primaryColor || '#7C3AED'

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [previewContract, setPreviewContract] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDrop, setShowClientDrop] = useState(false)

  const filtered = useMemo(() => contracts.filter(c => {
    const matchSearch = !search || [c.clientName, c.serviceDescription].some(s => s?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    return matchSearch && matchStatus
  }), [contracts, search, filterStatus])

  const counts = useMemo(() => ({
    todos: contracts.length,
    rascunho: contracts.filter(c => c.status === 'rascunho').length,
    enviado: contracts.filter(c => c.status === 'enviado').length,
    assinado: contracts.filter(c => c.status === 'assinado').length,
    cancelado: contracts.filter(c => c.status === 'cancelado').length,
  }), [contracts])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const selectClient = (client) => {
    setForm(f => ({
      ...f,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email || '',
      clientPhone: client.phone || '',
    }))
    setShowClientDrop(false)
    setClientSearch('')
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      clientId: c.clientId || '',
      clientName: c.clientName || '',
      clientNIF: c.clientNIF || '',
      clientAddress: c.clientAddress || '',
      clientEmail: c.clientEmail || '',
      clientPhone: c.clientPhone || '',
      serviceDescription: c.serviceDescription || '',
      totalValue: c.totalValue || '',
      contractDate: c.contractDate || todayStr(),
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      paymentMethod: c.paymentMethod || 'transferencia',
      paymentDate: c.paymentDate || '',
      installments: String(c.installments || '3'),
      firstPaymentDate: c.firstPaymentDate || '',
      notes: c.notes || '',
    })
    setModal(true)
  }

  const handleSave = () => {
    if (!form.clientName.trim() || !form.serviceDescription.trim()) return
    const paymentDescription = buildPaymentDescription(form)
    const paymentSchedule = buildPaymentSchedule(form)
    const data = {
      ...form,
      totalValue: parseFloat(form.totalValue) || 0,
      installments: parseInt(form.installments) || 1,
      paymentDescription,
      paymentSchedule: editing
        ? (contracts.find(c => c.id === editing)?.paymentSchedule || paymentSchedule)
        : paymentSchedule,
    }
    if (editing) updateContract(editing, data)
    else addContract(data)
    setModal(false)
  }

  const markSent = (id) => updateContract(id, { status: 'enviado', sentAt: todayStr() })
  const markSigned = (id) => updateContract(id, { status: 'assinado', signedAt: todayStr() })
  const markCancelled = (id) => updateContract(id, { status: 'cancelado' })

  const togglePayment = (contractId, paymentId) => {
    const c = contracts.find(x => x.id === contractId)
    if (!c) return
    const updated = c.paymentSchedule.map(p =>
      p.id === paymentId ? { ...p, paid: !p.paid } : p
    )
    updateContract(contractId, { paymentSchedule: updated })
  }

  const handlePrint = (contract) => {
    const html = generateContractHTML({
      ...contract,
      companyName: settings.companyName || '',
      companyNIF: settings.companyNIF || '',
      companyAddress: settings.companyAddress || '',
    })
    const blob = new Blob([`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="utf-8">
        <title>Contrato — ${contract.clientName}</title>
        <style>
          body { margin: 0; padding: 40px 60px; max-width: 900px; margin: auto; }
          @page { margin: 20mm; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${html}<script>setTimeout(()=>{window.print();},400);<\/script></body>
      </html>
    `], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 15000)
  }

  const contractHTML = previewContract
    ? generateContractHTML({
        ...previewContract,
        companyName: settings.companyName || '',
        companyNIF: settings.companyNIF || '',
        companyAddress: settings.companyAddress || '',
      })
    : ''

  const filteredClients = clients.filter(c =>
    !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const statusChips = [
    { id: 'todos', label: `Todos (${counts.todos})` },
    { id: 'rascunho', label: `Rascunho (${counts.rascunho})` },
    { id: 'enviado', label: `Enviados (${counts.enviado})` },
    { id: 'assinado', label: `Assinados (${counts.assinado})` },
    { id: 'cancelado', label: `Cancelados (${counts.cancelado})` },
  ]

  const statusColors = {
    rascunho: '#64748b', enviado: '#3b82f6', assinado: '#10b981', cancelado: '#ef4444',
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Status chips */}
      <div className="flex gap-2 flex-wrap">
        {statusChips.map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilterStatus(chip.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filterStatus === chip.id
                ? 'text-white border-transparent shadow-sm'
                : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'
            }`}
            style={filterStatus === chip.id ? { backgroundColor: pc, borderColor: pc } : {}}
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
            placeholder="Buscar por cliente ou descrição..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 flex-shrink-0"
          style={{ backgroundColor: pc }}
        >
          <Plus size={16} />
          Novo Contrato
        </button>
      </div>

      <p className="text-sm text-slate-500">
        {filtered.length} contrato{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Contract list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FileText size={40} strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum contrato encontrado</p>
          <p className="text-sm mt-1">Adicione ou ajuste os filtros</p>
          <button onClick={openNew} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: pc }}>
            Criar Contrato
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const overduePayments = contract.paymentSchedule?.filter(
              p => !p.paid && p.date && p.date < todayStr()
            ) || []
            const pendingPayments = contract.paymentSchedule?.filter(p => !p.paid) || []

            return (
              <div
                key={contract.id}
                className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: statusColors[contract.status] || '#64748b' }}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{contract.clientName}</p>
                          <Badge type={contract.status} />
                          {overduePayments.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
                              <AlertCircle size={10} />
                              {overduePayments.length} em atraso
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 truncate">{contract.serviceDescription}</p>
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-700">{fmt(contract.totalValue)}</span>
                          <span className="text-xs text-slate-400 capitalize">{
                            contract.paymentMethod === 'avista' ? 'À vista'
                            : contract.paymentMethod === 'parcelado' ? `${contract.installments}x parcelado`
                            : 'Transferência'
                          }</span>
                          {contract.sentAt && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Send size={10} /> Enviado em {fmtDate(contract.sentAt)}
                            </span>
                          )}
                          {contract.signedAt && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <PenLine size={10} /> Assinado em {fmtDate(contract.signedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPreviewContract(contract)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Visualizar contrato"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(contract)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Editar"
                      >
                        <PenLine size={16} />
                      </button>
                      {contract.status === 'rascunho' && (
                        <button
                          onClick={() => markSent(contract.id)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                          title="Marcar como Enviado"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      {contract.status === 'enviado' && (
                        <button
                          onClick={() => markSigned(contract.id)}
                          className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Marcar como Assinado"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(contract)}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Payment schedule pills */}
                  {contract.paymentSchedule?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                      {contract.paymentSchedule.map(p => (
                        <button
                          key={p.id}
                          onClick={() => togglePayment(contract.id, p.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                            p.paid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.date && p.date < todayStr()
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                          title={p.paid ? 'Clique para marcar como pendente' : 'Clique para marcar como pago'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.paid ? 'bg-emerald-500' : p.date && p.date < todayStr() ? 'bg-red-500' : 'bg-slate-400'}`} />
                          {p.date ? fmtDate(p.date) : '—'} · {fmt(p.amount)}
                          {p.paid && <CheckCircle2 size={10} />}
                        </button>
                      ))}
                      {pendingPayments.length > 0 && (
                        <span className="text-xs text-slate-400 flex items-center">
                          {pendingPayments.length} pendente{pendingPayments.length > 1 ? 's' : ''} · {fmt(pendingPayments.reduce((s, p) => s + p.amount, 0))}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── New / Edit Modal ─────────────────────────────────── */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Contrato' : 'Novo Contrato'} size="lg">
        <div className="space-y-6">

          {/* Section: Client */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dados da Cliente</h3>

            {/* Select from existing clients */}
            <div className="relative mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Buscar cliente existente</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientDrop(true) }}
                  onFocus={() => setShowClientDrop(true)}
                  placeholder="Digitar para buscar..."
                  className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              {showClientDrop && clientSearch && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredClients.slice(0, 6).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      {c.name}{c.email ? ` · ${c.email}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome completo *</label>
                <input value={form.clientName} onChange={set('clientName')} placeholder="Nome da cliente" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">NIF / BI</label>
                <input value={form.clientNIF} onChange={set('clientNIF')} placeholder="Nº documento" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone</label>
                <input value={form.clientPhone} onChange={set('clientPhone')} placeholder="+351 ..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
                <input type="email" value={form.clientEmail} onChange={set('clientEmail')} placeholder="email@exemplo.com" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Morada</label>
                <input value={form.clientAddress} onChange={set('clientAddress')} placeholder="Endereço completo" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Section: Service */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Serviço</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição do serviço *</label>
                <textarea
                  value={form.serviceDescription}
                  onChange={set('serviceDescription')}
                  rows={3}
                  placeholder="Descreva o serviço que será prestado..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor total (€) *</label>
                  <input
                    type="number"
                    value={form.totalValue}
                    onChange={set('totalValue')}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Data do contrato</label>
                  <input type="date" value={form.contractDate} onChange={set('contractDate')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de início</label>
                  <input type="date" value={form.startDate} onChange={set('startDate')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de término</label>
                  <input type="date" value={form.endDate} onChange={set('endDate')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Payment */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Forma de Pagamento</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, paymentMethod: m.id }))}
                  className={`py-2 text-sm rounded-xl border-2 font-medium transition-all ${
                    form.paymentMethod === m.id
                      ? 'text-white border-transparent'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                  style={form.paymentMethod === m.id ? { backgroundColor: pc, borderColor: pc } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {form.paymentMethod === 'parcelado' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Nº de parcelas</label>
                  <select value={form.installments} onChange={set('installments')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                    {[2,3,4,5,6,8,10,12].map(n => (
                      <option key={n} value={n}>{n}x de {fmt((parseFloat(form.totalValue)||0)/n)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Data da 1.ª parcela</label>
                  <input type="date" value={form.firstPaymentDate} onChange={set('firstPaymentDate')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de vencimento</label>
                <input type="date" value={form.paymentDate} onChange={set('paymentDate')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações internas</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Notas sobre este contrato (não aparecem no documento)..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.clientName.trim() || !form.serviceDescription.trim() || !form.totalValue}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pc }}
            >
              {editing ? 'Salvar Alterações' : 'Criar Contrato'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Preview Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!previewContract}
        onClose={() => setPreviewContract(null)}
        title={`Contrato — ${previewContract?.clientName || ''}`}
        size="xl"
      >
        {previewContract && (
          <div className="space-y-4">
            {/* Actions bar */}
            <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-100">
              <button
                onClick={() => handlePrint(previewContract)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
              >
                <Printer size={15} /> Imprimir / PDF
              </button>
              {previewContract.status === 'rascunho' && (
                <button
                  onClick={() => { markSent(previewContract.id); setPreviewContract(c => ({ ...c, status: 'enviado', sentAt: todayStr() })) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-white hover:opacity-90"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  <Send size={15} /> Marcar como Enviado
                </button>
              )}
              {previewContract.status === 'enviado' && (
                <button
                  onClick={() => { markSigned(previewContract.id); setPreviewContract(c => ({ ...c, status: 'assinado', signedAt: todayStr() })) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-white hover:opacity-90"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <CheckCircle2 size={15} /> Marcar como Assinado
                </button>
              )}
              <Badge type={previewContract.status} />
              {previewContract.sentAt && (
                <span className="text-xs text-slate-400 ml-auto">Enviado em {fmtDate(previewContract.sentAt)}</span>
              )}
            </div>

            {/* Contract document */}
            <div
              className="bg-white border border-slate-200 rounded-xl p-8 min-h-64"
              dangerouslySetInnerHTML={{ __html: contractHTML }}
            />
          </div>
        )}
      </Modal>

      {/* ── Confirm Delete ─────────────────────────────────────── */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Contrato" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Excluir o contrato de <strong>{confirmDelete?.clientName}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
            <button
              onClick={() => { deleteContract(confirmDelete.id); setConfirmDelete(null) }}
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
