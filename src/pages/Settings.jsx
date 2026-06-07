import { useState, useRef } from 'react'
import {
  Check, Upload, RotateCcw, Palette, Building2, Image as ImageIcon,
  Monitor, Sun, Moon, Sparkles, Globe, Phone, Mail, MapPin,
  Hash, Briefcase, Type, MessageSquare, Eye, Save,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const PRESET_COLORS = [
  { label: 'Rosa', value: '#D4547A' },
  { label: 'Rosa Claro', value: '#E8699A' },
  { label: 'Dourado', value: '#C9A96E' },
  { label: 'Coral', value: '#F97066' },
  { label: 'Roxo', value: '#A855F7' },
  { label: 'Azul', value: '#2563EB' },
  { label: 'Esmeralda', value: '#059669' },
  { label: 'Carvão', value: '#1E293B' },
]

const SECONDARY_COLORS = [
  { label: 'Dourado', value: '#C9A96E' },
  { label: 'Rose Gold', value: '#E8B4B8' },
  { label: 'Champagne', value: '#D4AF84' },
  { label: 'Lilás', value: '#C4B5FD' },
  { label: 'Coral', value: '#FDA4AF' },
  { label: 'Nude', value: '#E8C9A0' },
  { label: 'Ciano', value: '#06B6D4' },
  { label: 'Esmeralda', value: '#10B981' },
]

const SEGMENTS = [
  'Estética Facial', 'Estética Corporal', 'Nail Designer',
  'Cabeleireiro / Hair', 'Maquiagem Artística', 'Lash Designer',
  'Design de Sobrancelha', 'Dermopigmentação', 'Depilação',
  'Spa & Bem-estar', 'Cursos e Formações', 'Beleza e Estética', 'Outro',
]

const TABS = [
  { id: 'marca', label: 'Identidade Visual', icon: Palette },
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2 },
  { id: 'interface', label: 'Interface do Sistema', icon: Monitor },
]

function ColorPicker({ label, value, onChange, presets }) {
  const pc = value || presets[0].value
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-2">{label}</label>
      <div className="grid grid-cols-8 gap-2 mb-3">
        {presets.map(color => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            title={color.label}
            className={`h-9 rounded-xl transition-all hover:scale-105 active:scale-95 ${value === color.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : ''}`}
            style={{ backgroundColor: color.value }}
          >
            {value === color.value && (
              <Check size={13} className="mx-auto text-white" strokeWidth={3} />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden cursor-pointer flex-shrink-0 relative"
          style={{ backgroundColor: pc }}
        >
          <input
            type="color"
            value={pc}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Personalizada</p>
          <input
            type="text"
            value={pc}
            onChange={e => onChange(e.target.value)}
            placeholder="#7C3AED"
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none font-mono w-28"
          />
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
        {Icon && <Icon size={13} className="text-slate-400" />}
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 transition-all'

export default function Settings() {
  const { settings, updateSettings, resetData } = useApp()
  const [form, setForm] = useState({ ...settings })
  const [activeTab, setActiveTab] = useState('marca')
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const logoRef = useRef(null)

  const pc = form.primaryColor || '#7C3AED'
  const sc = form.secondaryColor || '#EC4899'

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setForm(f => ({ ...f, logoUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    resetData()
    setConfirmReset(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} style={{ color: pc }} />
            <h2 className="font-bold text-slate-800 text-lg">Personalização da Marca</h2>
          </div>
          <p className="text-sm text-slate-500">Configure a identidade visual e dados do negócio do seu cliente</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: pc }}
          >
            {saved ? <Check size={15} strokeWidth={3} /> : <Save size={15} />}
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Live Preview Banner */}
      {showPreview && (
        <div className="mb-5 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-medium text-slate-500 flex items-center gap-2">
            <Eye size={12} /> Preview — assim ficará o sistema do cliente
          </div>
          <div className="flex h-28">
            {/* Mini sidebar */}
            <div className="w-44 flex flex-col" style={{ backgroundColor: form.darkMode ? '#1e293b' : '#ffffff', borderRight: '1px solid', borderColor: form.darkMode ? '#334155' : '#f1f5f9' }}>
              <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: form.darkMode ? '#334155' : '#f1f5f9' }}>
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" className="h-6 w-auto max-w-[100px] object-contain" />
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: pc }}>
                      {(form.companyName || 'E').charAt(0)}
                    </div>
                    <span className="text-[11px] font-semibold truncate" style={{ color: form.darkMode ? '#f1f5f9' : '#0f172a' }}>
                      {form.companyName || 'Meu Negócio'}
                    </span>
                  </>
                )}
              </div>
              <div className="p-2 space-y-1">
                <div className="px-2 py-1.5 rounded-lg text-[10px] font-medium" style={{ backgroundColor: `${pc}18`, color: pc }}>
                  ■ Dashboard
                </div>
                <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ color: form.darkMode ? '#94a3b8' : '#64748b' }}>
                  ■ Clientes
                </div>
                <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ color: form.darkMode ? '#94a3b8' : '#64748b' }}>
                  ■ Projetos
                </div>
              </div>
            </div>
            {/* Mini content */}
            <div className="flex-1 p-4 flex flex-col gap-2" style={{ backgroundColor: form.darkMode ? '#0f172a' : '#f8fafc' }}>
              <p className="text-xs font-bold" style={{ color: form.darkMode ? '#f1f5f9' : '#0f172a' }}>
                {form.welcomeMessage || 'Olá! Aqui está o resumo.'}
              </p>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white" style={{ backgroundColor: pc }}>
                  Botão Principal
                </div>
                <div className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white" style={{ backgroundColor: sc }}>
                  Destaque
                </div>
                <span className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: `${pc}18`, color: pc }}>
                  Badge
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-2xl">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-all font-medium ${isActive ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={isActive ? { color: pc } : {}}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ---- TAB: IDENTIDADE VISUAL ---- */}
      {activeTab === 'marca' && (
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
                <ImageIcon size={18} style={{ color: pc }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Logotipo</h3>
                <p className="text-xs text-slate-500">Aparece na barra lateral do sistema</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Logo Preview */}
              <div
                className="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 relative group cursor-pointer"
                style={{ borderColor: form.logoUrl ? pc : '#e2e8f0' }}
                onClick={() => logoRef.current?.click()}
              >
                {form.logoUrl ? (
                  <>
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon size={24} className="mx-auto mb-1" strokeWidth={1.5} />
                    <p className="text-[10px]">Upload</p>
                  </div>
                )}
              </div>

              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

              <div className="flex-1 space-y-3">
                <button
                  onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Upload size={15} />
                  {form.logoUrl ? 'Trocar logotipo' : 'Fazer upload do logo'}
                </button>
                {form.logoUrl && (
                  <button
                    onClick={() => setVal('logoUrl', null)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-100 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Remover logo
                  </button>
                )}
                <p className="text-xs text-slate-400">PNG, JPG ou SVG · Recomendado: fundo transparente</p>
              </div>
            </div>
          </div>

          {/* Primary Color */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
                <Palette size={18} style={{ color: pc }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Cores da Marca</h3>
                <p className="text-xs text-slate-500">Aplicadas em botões, sidebar, badges e destaques</p>
              </div>
            </div>

            <div className="space-y-6">
              <ColorPicker
                label="Cor Primária — botões, itens ativos, destaques principais"
                value={form.primaryColor}
                onChange={v => setVal('primaryColor', v)}
                presets={PRESET_COLORS}
              />
              <div className="border-t border-slate-50 pt-6">
                <ColorPicker
                  label="Cor Secundária / Destaque — badges, acentos, ícones"
                  value={form.secondaryColor}
                  onChange={v => setVal('secondaryColor', v)}
                  presets={SECONDARY_COLORS}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: DADOS DA EMPRESA ---- */}
      {activeTab === 'empresa' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
              <Building2 size={18} style={{ color: pc }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Dados da Empresa</h3>
              <p className="text-xs text-slate-500">Informações que identificam o negócio do cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field icon={Building2} label="Nome da Empresa *">
                <input value={form.companyName} onChange={set('companyName')} placeholder="Ex: Bella Estética" className={inputClass} />
              </Field>
            </div>

            <Field icon={Briefcase} label="Segmento / Tipo de Negócio">
              <select value={form.segment || ''} onChange={set('segment')} className={`${inputClass} bg-white`}>
                <option value="">Selecionar...</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field icon={Hash} label="CNPJ">
              <input value={form.cnpj || ''} onChange={set('cnpj')} placeholder="00.000.000/0001-00" className={inputClass} />
            </Field>

            <div className="sm:col-span-2">
              <Field icon={MapPin} label="Endereço Completo">
                <input value={form.address || ''} onChange={set('address')} placeholder="Rua, número, bairro, cidade - UF" className={inputClass} />
              </Field>
            </div>

            <Field icon={Phone} label="Telefone / WhatsApp">
              <input value={form.phone || ''} onChange={set('phone')} placeholder="(11) 99999-9999" className={inputClass} />
            </Field>

            <Field icon={Mail} label="E-mail de Contato">
              <input type="email" value={form.contactEmail || ''} onChange={set('contactEmail')} placeholder="contato@empresa.com.br" className={inputClass} />
            </Field>

            <div className="sm:col-span-2">
              <Field icon={Globe} label="Site">
                <input value={form.website || ''} onChange={set('website')} placeholder="www.empresa.com.br" className={inputClass} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: INTERFACE ---- */}
      {activeTab === 'interface' && (
        <div className="space-y-5">
          {/* System name + welcome */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
                <Type size={18} style={{ color: pc }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Texto e Identificação</h3>
                <p className="text-xs text-slate-500">O que aparece no cabeçalho e na tela inicial</p>
              </div>
            </div>

            <Field icon={Type} label="Nome do Sistema (aparece no header do CRM)">
              <input
                value={form.systemName || ''}
                onChange={set('systemName')}
                placeholder="Ex: CRM da Bella Estética"
                className={inputClass}
              />
              <p className="text-xs text-slate-400 mt-1">Este é o nome que aparece no topo do sistema abaixo do título de cada página.</p>
            </Field>

            <Field icon={MessageSquare} label="Mensagem de Boas-vindas no Dashboard">
              <input
                value={form.welcomeMessage || ''}
                onChange={set('welcomeMessage')}
                placeholder="Ex: Olá! Aqui está o resumo do seu negócio hoje."
                className={inputClass}
              />
              <p className="text-xs text-slate-400 mt-1">Aparece no Dashboard toda vez que o sistema é aberto.</p>
            </Field>
          </div>

          {/* Dark Mode */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pc}18` }}>
                <Monitor size={18} style={{ color: pc }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Tema da Interface</h3>
                <p className="text-xs text-slate-500">Tema claro ou escuro — aplicado instantaneamente</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVal('darkMode', false)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${!form.darkMode ? 'shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                style={!form.darkMode ? { borderColor: pc, backgroundColor: `${pc}08` } : {}}
              >
                <Sun size={28} style={{ color: !form.darkMode ? pc : '#94a3b8' }} />
                <div className="text-center">
                  <p className={`text-sm font-semibold ${!form.darkMode ? 'text-slate-800' : 'text-slate-500'}`}>Tema Claro</p>
                  <p className="text-xs text-slate-400 mt-0.5">Fundo branco, ideal para ambientes iluminados</p>
                </div>
                {!form.darkMode && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: pc }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>

              <button
                onClick={() => setVal('darkMode', true)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${form.darkMode ? 'shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                style={form.darkMode ? { borderColor: pc, backgroundColor: `${pc}08` } : {}}
              >
                <Moon size={28} style={{ color: form.darkMode ? pc : '#94a3b8' }} />
                <div className="text-center">
                  <p className={`text-sm font-semibold ${form.darkMode ? 'text-slate-800' : 'text-slate-500'}`}>Tema Escuro</p>
                  <p className="text-xs text-slate-400 mt-0.5">Fundo escuro, ideal para uso noturno</p>
                </div>
                {form.darkMode && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: pc }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              ⚡ A mudança de tema é aplicada imediatamente, sem precisar salvar.
            </p>
          </div>
        </div>
      )}

      {/* Save Footer */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
        <div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500 transition-colors">
              <RotateCcw size={14} />
              Restaurar dados de exemplo
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-500 font-medium">Confirmar? Isso apaga tudo.</span>
              <button onClick={handleReset} className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600">Sim</button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50">Não</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5"><Check size={14} strokeWidth={3} /> Configurações salvas!</span>}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: pc }}
          >
            <Save size={15} />
            Salvar Tudo
          </button>
        </div>
      </div>
    </div>
  )
}
