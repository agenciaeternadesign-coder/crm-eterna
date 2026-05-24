import { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultSettings } from '../data/sampleData'

const AppContext = createContext(null)

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const today = () => new Date().toISOString().split('T')[0]

export function AppProvider({ children }) {
  const [clients, setClients] = useLocalStorage('crm_clients', [])
  const [projects, setProjects] = useLocalStorage('crm_projects', [])
  const [financial, setFinancial] = useLocalStorage('crm_financial', [])
  const [events, setEvents] = useLocalStorage('crm_events', [])
  const [pipeline, setPipeline] = useLocalStorage('crm_pipeline', [])
  const [settings, setSettings] = useLocalStorage('crm_settings', defaultSettings)

  // Clients
  const addClient = (data) => setClients(p => [...p, { ...data, id: generateId(), createdAt: today() }])
  const updateClient = (id, data) => setClients(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  const deleteClient = (id) => setClients(p => p.filter(c => c.id !== id))

  // Projects
  const addProject = (data) => setProjects(p => [...p, { ...data, id: generateId(), createdAt: today() }])
  const updateProject = (id, data) => setProjects(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  const deleteProject = (id) => setProjects(p => p.filter(c => c.id !== id))

  // Financial
  const addEntry = (data) => setFinancial(p => [...p, { ...data, id: generateId() }])
  const updateEntry = (id, data) => setFinancial(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  const deleteEntry = (id) => setFinancial(p => p.filter(c => c.id !== id))

  // Events
  const addEvent = (data) => setEvents(p => [...p, { ...data, id: generateId() }])
  const updateEvent = (id, data) => setEvents(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  const deleteEvent = (id) => setEvents(p => p.filter(c => c.id !== id))

  // Pipeline
  const addPipelineCard = (data) => setPipeline(p => [...p, { ...data, id: generateId(), createdAt: today() }])
  const updatePipelineCard = (id, data) => setPipeline(p => p.map(c => c.id === id ? { ...c, ...data } : c))
  const deletePipelineCard = (id) => setPipeline(p => p.filter(c => c.id !== id))

  // Apply CSS variables + dark mode whenever settings change
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--crm-primary', settings.primaryColor || '#7C3AED')
    root.style.setProperty('--crm-secondary', settings.secondaryColor || '#EC4899')
    if (settings.darkMode) {
      document.body.classList.add('crm-dark')
    } else {
      document.body.classList.remove('crm-dark')
    }
  }, [settings.primaryColor, settings.secondaryColor, settings.darkMode])

  // Settings
  const updateSettings = (data) => setSettings(p => ({ ...p, ...data }))

  const resetData = () => {
    setClients(sampleClients)
    setProjects(sampleProjects)
    setFinancial(sampleFinancial)
    setEvents(sampleEvents)
    setPipeline(samplePipeline)
  }

  // Helpers
  const getClientById = (id) => clients.find(c => c.id === id)

  return (
    <AppContext.Provider value={{
      clients, projects, financial, events, pipeline, settings,
      addClient, updateClient, deleteClient,
      addProject, updateProject, deleteProject,
      addEntry, updateEntry, deleteEntry,
      addEvent, updateEvent, deleteEvent,
      addPipelineCard, updatePipelineCard, deletePipelineCard,
      updateSettings, resetData,
      getClientById,
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
