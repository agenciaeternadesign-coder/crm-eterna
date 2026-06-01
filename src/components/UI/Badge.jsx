const styles = {
  ativo: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inativo: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  concluido: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  em_andamento: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  a_fazer: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  pago: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pendente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  entrada: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  saida: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  // contact types
  cliente: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
  // project types
  produto: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  equipamento: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  servico: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  formacao: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  // legacy pipeline stages (kept for safety)
  leads: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  proposta: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  fechado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  perdido: 'bg-red-50 text-red-600 ring-1 ring-red-200',
}

const labels = {
  ativo: 'Ativo', inativo: 'Inativo',
  concluido: 'Concluído', em_andamento: 'Em Andamento', a_fazer: 'A Fazer',
  pago: 'Pago', pendente: 'Pendente',
  entrada: 'Entrada', saida: 'Saída',
  cliente: 'Cliente',
  produto: 'Produto', equipamento: 'Equipamento', servico: 'Serviço', formacao: 'Formação',
}

export default function Badge({ type, label, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-600'} ${className}`}>
      {label || labels[type] || type}
    </span>
  )
}
