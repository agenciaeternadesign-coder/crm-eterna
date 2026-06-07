import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Modal from './Modal'

// ── Mapas de colunas aceites (PT + EN) ──────────────────
const CLIENT_MAP = {
  name:    ['nome', 'name', 'cliente', 'contacto', 'contact', 'client'],
  company: ['empresa', 'company', 'negócio', 'negocio', 'business', 'organização', 'organizacao'],
  email:   ['email', 'e-mail', 'mail', 'correio'],
  phone:   ['telefone', 'phone', 'telemovel', 'telemóvel', 'celular', 'mobile', 'tel', 'whatsapp'],
  segment: ['segmento', 'segment', 'área', 'area', 'nicho', 'categoria'],
  status:  ['status', 'estado', 'situação', 'situacao'],
  tipo:    ['tipo', 'type', 'perfil'],
  notes:   ['notas', 'notes', 'observações', 'observacoes', 'obs', 'comentário', 'comentario'],
}

const SERVICE_MAP = {
  name:        ['nome', 'name', 'serviço', 'servico', 'projeto', 'project', 'título', 'titulo', 'title'],
  description: ['descrição', 'descricao', 'description', 'desc', 'detalhes', 'details'],
  status:      ['status', 'estado', 'situação', 'situacao'],
  tipo:        ['tipo', 'type'],
  dueDate:     ['prazo', 'due', 'data_prazo', 'vencimento', 'deadline', 'entrega', 'data_entrega'],
  responsible: ['responsável', 'responsavel', 'responsible', 'profissional'],
  notes:       ['notas', 'notes', 'observações', 'observacoes', 'obs'],
}

// Faz o match da coluna do ficheiro com o campo interno
function mapColumns(headers, fieldMap) {
  const result = {}
  headers.forEach(h => {
    const hNorm = h.toLowerCase().trim().replace(/\s+/g, '_')
    for (const [field, aliases] of Object.entries(fieldMap)) {
      if (!result[field] && aliases.some(a => hNorm.includes(a) || a.includes(hNorm))) {
        result[field] = h
      }
    }
  })
  return result
}

// Normaliza um valor de linha para o campo interno
function normalizeRow(row, mapping, type = 'client') {
  const out = {}
  for (const [field, header] of Object.entries(mapping)) {
    if (header && row[header] !== undefined && row[header] !== null && row[header] !== '') {
      out[field] = String(row[header]).trim()
    }
  }

  if (type === 'client') {
    out.status = out.status || 'ativo'
    out.tipo   = out.tipo   || 'cliente'
  } else {
    out.status = out.status || 'a_fazer'
    out.tipo   = out.tipo   || 'servico'
  }

  return out
}

// ── Templates para download ──────────────────────────────
const CLIENT_TEMPLATE = [
  { nome: 'Ana Silva', empresa: 'Studio Ana', email: 'ana@email.com', telefone: '11 99999-0001', segmento: 'Lash Designer', status: 'ativo', tipo: 'cliente' },
  { nome: 'Maria Santos', empresa: '', email: 'maria@email.com', telefone: '11 99999-0002', segmento: 'Estética Facial', status: 'ativo', tipo: 'aluna' },
]

const SERVICE_TEMPLATE = [
  { nome: 'Lifting de Cílios', descrição: 'Sessão completa', status: 'em_andamento', tipo: 'servico', prazo: '2024-12-31', responsável: 'Ana' },
  { nome: 'Curso Extensão de Cílios', descrição: 'Turma novembro', status: 'a_fazer', tipo: 'formacao', prazo: '2024-11-15', responsável: 'Maria' },
]

function downloadTemplate(type) {
  const data = type === 'client' ? CLIENT_TEMPLATE : SERVICE_TEMPLATE
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')
  XLSX.writeFile(wb, type === 'client' ? 'template_clientes.xlsx' : 'template_servicos.xlsx')
}

// ── Componente principal ─────────────────────────────────
export default function ImportModal({ isOpen, onClose, onImport, type = 'client', primaryColor }) {
  const pc = primaryColor || '#D4547A'
  const fieldMap = type === 'client' ? CLIENT_MAP : SERVICE_MAP
  const [step, setStep]       = useState('upload')   // upload | preview | done
  const [rows, setRows]       = useState([])
  const [mapping, setMapping] = useState({})
  const [headers, setHeaders] = useState([])
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const reset = () => { setStep('upload'); setRows([]); setMapping({}); setHeaders([]); setError('') }
  const handleClose = () => { reset(); onClose() }

  const handleFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls', 'ods'].includes(ext)) {
      setError('Formato não suportado. Use CSV, Excel (.xlsx / .xls) ou ODS.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!raw.length) { setError('O ficheiro está vazio.'); return }
        const hdrs = Object.keys(raw[0])
        const map  = mapColumns(hdrs, fieldMap)
        setHeaders(hdrs)
        setMapping(map)
        setRows(raw.slice(0, 200)) // máx 200 linhas por importação
        setStep('preview')
      } catch {
        setError('Não foi possível ler o ficheiro. Verifique o formato.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    setLoading(true)
    const normalized = rows
      .map(r => normalizeRow(r, mapping, type))
      .filter(r => r.name?.trim())
    await onImport(normalized)
    setLoading(false)
    setStep('done')
  }

  const requiredMapped = mapping.name

  // Preview columns to show
  const previewFields = type === 'client'
    ? ['name','company','email','phone','segment','tipo','status']
    : ['name','description','status','tipo','dueDate','responsible']

  const validRows = rows.filter(r => {
    const nameHeader = mapping.name
    return nameHeader && String(r[nameHeader] || '').trim()
  })

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Importar ${type === 'client' ? 'Clientes' : 'Serviços'}`} size="lg">
      <div className="space-y-4">

        {/* Step: Upload */}
        {step === 'upload' && (
          <>
            {/* Download template */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileSpreadsheet size={16} className="text-emerald-600" />
                Sem ficheiro? Descarrega o modelo Excel
              </div>
              <button
                onClick={() => downloadTemplate(type)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-600"
              >
                <Download size={13} />
                Modelo .xlsx
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <Upload size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">Arrasta o ficheiro aqui ou clica para escolher</p>
              <p className="text-xs text-slate-400 mt-1">CSV · Excel (.xlsx / .xls) · ODS — máx. 200 linhas</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.ods"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <p className="text-xs text-slate-400 text-center">
              Colunas reconhecidas automaticamente em Português e Inglês
            </p>
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <>
            {/* Mapping status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {previewFields.map(field => {
                const mapped = mapping[field]
                return (
                  <div key={field} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${mapped ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                    {mapped ? <CheckCircle2 size={12} /> : <X size={12} />}
                    <span className="font-medium capitalize">{field}</span>
                    {mapped && <span className="truncate opacity-60">← {mapped}</span>}
                  </div>
                )
              })}
            </div>

            {!requiredMapped && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl p-3">
                <AlertCircle size={15} />
                Coluna "nome" não encontrada. Renomeia a coluna no ficheiro para "nome" ou "name".
              </div>
            )}

            {/* Preview table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {previewFields.filter(f => mapping[f]).map(f => (
                      <th key={f} className="px-3 py-2 text-left text-slate-500 font-medium capitalize whitespace-nowrap">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.slice(0, 5).map((row, i) => {
                    const norm = normalizeRow(row, mapping, type)
                    return (
                      <tr key={i} className={norm.name ? '' : 'opacity-30'}>
                        {previewFields.filter(f => mapping[f]).map(f => (
                          <td key={f} className="px-3 py-2 text-slate-600 max-w-[140px] truncate">{norm[f] || '—'}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                <strong className="text-slate-800">{validRows.length}</strong> de {rows.length} linhas prontas para importar
                {rows.length > 5 && <span className="text-slate-400"> (a mostrar 5)</span>}
              </span>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600">← Trocar ficheiro</button>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Cancelar</button>
              <button
                onClick={handleImport}
                disabled={!requiredMapped || validRows.length === 0 || loading}
                className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: pc }}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> A importar...</>
                ) : (
                  <>Importar {validRows.length} registo{validRows.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Importação concluída!</p>
              <p className="text-sm text-slate-500 mt-1">{validRows.length} {type === 'client' ? 'clientes' : 'serviços'} adicionados com sucesso.</p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 text-sm rounded-xl text-white font-medium hover:opacity-90"
              style={{ backgroundColor: pc }}
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
