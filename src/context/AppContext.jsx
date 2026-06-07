import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { defaultSettings } from '../data/sampleData'

const AppContext = createContext(null)

// ── snake_case ↔ camelCase helpers ────────────────────────
const toCamel = (row) => {
  if (!row) return row
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    const ck = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
    out[ck] = v
  }
  delete out.userId   // não expor user_id aos componentes
  return out
}

const toSnake = (obj) => {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id' || k === 'createdAt' || k === 'updatedAt') continue
    if (v === undefined) continue
    const sk = k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)
    out[sk] = v === '' ? null : v
  }
  return out
}

// ── Mapeamento especial para settings ─────────────────────
const settingsFromRow = (row) => ({
  companyName:    row.company_name,
  systemName:     row.system_name,
  segment:        row.segment,
  primaryColor:   row.primary_color   || '#D4547A',
  secondaryColor: row.secondary_color || '#C9A96E',
  logoUrl:        row.logo_url,
  welcomeMessage: row.welcome_message,
  darkMode:       row.dark_mode       || false,
})

const settingsToRow = (obj) => ({
  company_name:    obj.companyName    ?? null,
  system_name:     obj.systemName     ?? null,
  segment:         obj.segment        ?? null,
  primary_color:   obj.primaryColor   ?? '#D4547A',
  secondary_color: obj.secondaryColor ?? '#C9A96E',
  logo_url:        obj.logoUrl        ?? null,
  welcome_message: obj.welcomeMessage ?? null,
  dark_mode:       obj.darkMode       ?? false,
})

// ─────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const { user } = useAuth()

  const [clients,  setClients]  = useState([])
  const [projects, setProjects] = useState([])
  const [financial,setFinancial]= useState([])
  const [events,   setEvents]   = useState([])
  const [pipeline, setPipeline] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [loading,  setLoading]  = useState(true)

  // ── Carregar dados quando o utilizador muda ───────────
  useEffect(() => {
    if (!user) {
      setClients([]); setProjects([]); setFinancial([])
      setEvents([]); setPipeline([]); setSettings(defaultSettings)
      setLoading(false)
      return
    }
    fetchAll()
  }, [user?.id])

  const fetchAll = async () => {
    setLoading(true)
    const [c, p, f, e, pi, s] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('financial').select('*').order('date', { ascending: false }),
      supabase.from('events').select('*').order('date', { ascending: true }),
      supabase.from('pipeline').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle(),
    ])
    setClients((c.data  || []).map(toCamel))
    setProjects((p.data || []).map(toCamel))
    setFinancial((f.data|| []).map(toCamel))
    setEvents((e.data   || []).map(toCamel))
    setPipeline((pi.data|| []).map(toCamel))
    if (s.data) setSettings({ ...defaultSettings, ...settingsFromRow(s.data) })
    setLoading(false)
  }

  // ── Clients ───────────────────────────────────────────
  const addClient = async (data) => {
    const { data: row, error } = await supabase
      .from('clients').insert({ ...toSnake(data), user_id: user.id })
      .select().single()
    if (!error && row) setClients(p => [toCamel(row), ...p])
  }
  const updateClient = async (id, data) => {
    const { error } = await supabase.from('clients').update(toSnake(data)).eq('id', id)
    if (!error) setClients(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  }
  const deleteClient = async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) setClients(p => p.filter(c => c.id !== id))
  }

  // ── Projects (serviços) ───────────────────────────────
  const addProject = async (data) => {
    const { data: row, error } = await supabase
      .from('projects').insert({ ...toSnake(data), user_id: user.id })
      .select().single()
    if (!error && row) setProjects(p => [toCamel(row), ...p])
  }
  const updateProject = async (id, data) => {
    const { error } = await supabase.from('projects').update(toSnake(data)).eq('id', id)
    if (!error) setProjects(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  }
  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(p => p.filter(c => c.id !== id))
  }

  // ── Financial ─────────────────────────────────────────
  const addEntry = async (data) => {
    const { data: row, error } = await supabase
      .from('financial').insert({ ...toSnake(data), user_id: user.id })
      .select().single()
    if (!error && row) setFinancial(p => [toCamel(row), ...p])
  }
  const updateEntry = async (id, data) => {
    const { error } = await supabase.from('financial').update(toSnake(data)).eq('id', id)
    if (!error) setFinancial(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  }
  const deleteEntry = async (id) => {
    const { error } = await supabase.from('financial').delete().eq('id', id)
    if (!error) setFinancial(p => p.filter(c => c.id !== id))
  }

  // ── Events (agenda) ───────────────────────────────────
  const addEvent = async (data) => {
    const { data: row, error } = await supabase
      .from('events').insert({ ...toSnake(data), user_id: user.id })
      .select().single()
    if (!error && row) setEvents(p => [...p, toCamel(row)].sort((a, b) => a.date > b.date ? 1 : -1))
  }
  const updateEvent = async (id, data) => {
    const { error } = await supabase.from('events').update(toSnake(data)).eq('id', id)
    if (!error) setEvents(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  }
  const deleteEvent = async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) setEvents(p => p.filter(c => c.id !== id))
  }

  // ── Pipeline ──────────────────────────────────────────
  const addPipelineCard = async (data) => {
    const { data: row, error } = await supabase
      .from('pipeline').insert({ ...toSnake(data), user_id: user.id })
      .select().single()
    if (!error && row) setPipeline(p => [toCamel(row), ...p])
  }
  const updatePipelineCard = async (id, data) => {
    const { error } = await supabase.from('pipeline').update(toSnake(data)).eq('id', id)
    if (!error) setPipeline(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  }
  const deletePipelineCard = async (id) => {
    const { error } = await supabase.from('pipeline').delete().eq('id', id)
    if (!error) setPipeline(p => p.filter(c => c.id !== id))
  }

  // ── Settings ──────────────────────────────────────────
  const updateSettings = async (data) => {
    const newSettings = { ...settings, ...data }
    setSettings(newSettings) // optimistic
    await supabase.from('settings').upsert(
      { user_id: user.id, ...settingsToRow(newSettings), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  // ── CSS variables ─────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--crm-primary', settings.primaryColor || '#D4547A')
    root.style.setProperty('--crm-secondary', settings.secondaryColor || '#C9A96E')
    if (settings.darkMode) document.body.classList.add('crm-dark')
    else document.body.classList.remove('crm-dark')
  }, [settings.primaryColor, settings.secondaryColor, settings.darkMode])

  // ── Helpers ───────────────────────────────────────────
  const getClientById = (id) => clients.find(c => c.id === id)
  const resetData = () => {} // no-op em modo cloud

  return (
    <AppContext.Provider value={{
      clients, projects, financial, events, pipeline, settings, loading,
      addClient, updateClient, deleteClient,
      addProject, updateProject, deleteProject,
      addEntry, updateEntry, deleteEntry,
      addEvent, updateEvent, deleteEvent,
      addPipelineCard, updatePipelineCard, deletePipelineCard,
      updateSettings, resetData, getClientById,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
