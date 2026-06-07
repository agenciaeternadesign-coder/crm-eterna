import { createContext, useContext, useState, useEffect } from 'react'

const TeamContext = createContext(null)

const load = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

export function TeamProvider({ children }) {
  const [members,    setMembers]    = useState(() => load('crm_equipa', []))
  const [production, setProduction] = useState(() => load('crm_equipa_producao', []))
  const [payments,   setPayments]   = useState(() => load('crm_equipa_pagamentos', []))

  useEffect(() => { localStorage.setItem('crm_equipa',             JSON.stringify(members))    }, [members])
  useEffect(() => { localStorage.setItem('crm_equipa_producao',    JSON.stringify(production)) }, [production])
  useEffect(() => { localStorage.setItem('crm_equipa_pagamentos',  JSON.stringify(payments))   }, [payments])

  // ── Members ───────────────────────────────────────────
  const addMember = (data) => {
    const m = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setMembers(prev => [m, ...prev])
    return m
  }
  const updateMember = (id, data) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  }
  const deleteMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    setProduction(prev => prev.filter(p => p.memberId !== id))
    setPayments(prev => prev.filter(p => p.memberId !== id))
  }

  // ── Production ────────────────────────────────────────
  const addProduction = (data) => {
    const r = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setProduction(prev => [r, ...prev])
    return r
  }
  const updateProduction = (id, data) => {
    setProduction(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
  }
  const deleteProduction = (id) => {
    setProduction(prev => prev.filter(r => r.id !== id))
  }
  const getProductionByMember = (memberId, month) => {
    return production.filter(r =>
      r.memberId === memberId && (!month || r.date?.startsWith(month))
    )
  }

  // ── Payments ──────────────────────────────────────────
  const getPayment = (memberId, month, type) =>
    payments.find(p => p.memberId === memberId && p.month === month && p.type === type)

  const markPayment = (memberId, month, type, amount) => {
    const existing = getPayment(memberId, month, type)
    if (existing) {
      setPayments(prev => prev.map(p =>
        p.memberId === memberId && p.month === month && p.type === type
          ? { ...p, status: 'pago', amount, paidAt: new Date().toISOString() }
          : p
      ))
    } else {
      const p = { id: crypto.randomUUID(), memberId, month, type, amount, status: 'pago', paidAt: new Date().toISOString() }
      setPayments(prev => [p, ...prev])
    }
  }

  const unmarkPayment = (memberId, month, type) => {
    setPayments(prev => prev.filter(p =>
      !(p.memberId === memberId && p.month === month && p.type === type)
    ))
  }

  return (
    <TeamContext.Provider value={{
      members, production, payments,
      addMember, updateMember, deleteMember,
      addProduction, updateProduction, deleteProduction, getProductionByMember,
      markPayment, unmarkPayment, getPayment,
    }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
