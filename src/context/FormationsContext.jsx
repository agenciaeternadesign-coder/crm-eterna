import { createContext, useContext, useState, useEffect } from 'react'

const FormationsContext = createContext(null)

const LS_FORMATIONS = 'crm_formacoes'
const LS_STUDENTS   = 'crm_formacoes_alunas'

const load = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? [] } catch { return [] }
}
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data))
const uid  = () => crypto.randomUUID()

export function FormationsProvider({ children }) {
  const [formations, setFormations] = useState(() => load(LS_FORMATIONS))
  const [students,   setStudents]   = useState(() => load(LS_STUDENTS))

  useEffect(() => save(LS_FORMATIONS, formations), [formations])
  useEffect(() => save(LS_STUDENTS,   students),   [students])

  // ── Formações ─────────────────────────────────────────
  const addFormation = (data) => {
    const f = { ...data, id: uid(), createdAt: new Date().toISOString() }
    setFormations(prev => [f, ...prev])
    return f
  }
  const updateFormation = (id, data) =>
    setFormations(prev => prev.map(f => f.id === id ? { ...f, ...data } : f))
  const deleteFormation = (id) => {
    setFormations(prev => prev.filter(f => f.id !== id))
    setStudents(prev => prev.filter(s => s.formationId !== id))
  }

  // ── Alunas ────────────────────────────────────────────
  const addStudent = (formationId, data) => {
    const s = {
      ...data, id: uid(), formationId,
      status: 'inscrita', paid: false, paidAmount: 0, paymentDate: '',
      certificateIssued: false, certificateDate: '',
      createdAt: new Date().toISOString(),
    }
    setStudents(prev => [s, ...prev])
    return s
  }
  const updateStudent = (id, data) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  const deleteStudent = (id) =>
    setStudents(prev => prev.filter(s => s.id !== id))

  const getStudentsByFormation = (formationId) =>
    students.filter(s => s.formationId === formationId)

  // ── Receita total de formações ────────────────────────
  const formationsRevenue = students
    .filter(s => s.paid)
    .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0)

  // receita do mês actual
  const thisMonth = new Date().toISOString().slice(0, 7)
  const formationsRevenueMonth = students
    .filter(s => s.paid && s.paymentDate?.startsWith(thisMonth))
    .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0)

  return (
    <FormationsContext.Provider value={{
      formations, students,
      addFormation, updateFormation, deleteFormation,
      addStudent, updateStudent, deleteStudent,
      getStudentsByFormation,
      formationsRevenue,
      formationsRevenueMonth,
    }}>
      {children}
    </FormationsContext.Provider>
  )
}

export const useFormations = () => useContext(FormationsContext)
