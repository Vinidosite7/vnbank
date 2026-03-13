import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle, HandCoins, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type DebtStatus = 'pendente' | 'parcial' | 'recebido'
interface Debt {
  id: string; user_id: string; devedor: string; descricao: string
  valor: number; valor_recebido: number; status: DebtStatus; data: string; created_at: string
}

const STATUS_LABELS: Record<DebtStatus, string> = { pendente: 'Pendente', parcial: 'Parcial', recebido: 'Recebido' }
const STATUS_COLORS: Record<DebtStatus, string> = { pendente: '#ef4444', parcial: '#eab308', recebido: '#4ade80' }
const STATUS_ICONS: Record<DebtStatus, typeof Clock> = { pendente: AlertCircle, parcial: Clock, recebido: CheckCircle2 }

function SpotlightCard({ children, className = '', glowColor = 'rgba(255,255,255,0.05)', onClick }: {
  children: React.ReactNode; className?: string; glowColor?: string; onClick?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState(false)
  return (
    <div ref={ref} onClick={onClick}
      onMouseMove={e => { const r = ref.current?.getBoundingClientRect(); if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={`relative overflow-hidden rounded-xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: hover ? 1 : 0, background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 70%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</label>
      {children}
    </div>
  )
}

function StyledInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full bg-transparent text-white text-sm placeholder-zinc-700 focus:outline-none py-2.5 px-0 tracking-wide"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.3)')}
      onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)')}
    />
  )
}

export default function DividasPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<DebtStatus | 'todos'>('todos')
  const [formData, setFormData] = useState({
    devedor: '', descricao: '', valor: '', valor_recebido: '',
    status: 'pendente' as DebtStatus, data: new Date().toISOString().split('T')[0],
  })

  useEffect(() => { fetchDebts() }, [])

  async function fetchDebts() {
    setLoading(true)
    const { data, error } = await supabase.from('dividas').select('*').order('created_at', { ascending: false })
    if (!error && data) setDebts(data)
    setLoading(false)
    setTimeout(() => setMounted(true), 50)
  }

  const resetForm = () => {
    setFormData({ devedor: '', descricao: '', valor: '', valor_recebido: '', status: 'pendente', data: new Date().toISOString().split('T')[0] })
    setEditingId(null)
  }

  const resolveStatus = (valor: number, valor_recebido: number, status: DebtStatus): DebtStatus => {
    if (valor_recebido >= valor && valor > 0) return 'recebido'
    if (valor_recebido > 0) return 'parcial'
    return status
  }

  const handleSubmit = async () => {
    if (!formData.devedor || !formData.valor) return
    setSaving(true)
    const valor = parseFloat(formData.valor) || 0
    const valor_recebido = parseFloat(formData.valor_recebido) || 0
    const status = resolveStatus(valor, valor_recebido, formData.status)
    const payload = { devedor: formData.devedor, descricao: formData.descricao || null, valor, valor_recebido, status, data: formData.data }

    if (editingId) {
      const { data, error } = await supabase.from('dividas').update(payload).eq('id', editingId).select().single()
      if (!error && data) setDebts(prev => prev.map(d => d.id === editingId ? data : d))
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('dividas').insert([{ ...payload, user_id: userData.user?.id }]).select().single()
      if (!error && data) setDebts(prev => [data, ...prev])
    }
    setSaving(false); resetForm(); setIsDialogOpen(false)
  }

  const handleEdit = (debt: Debt) => {
    setFormData({ devedor: debt.devedor, descricao: debt.descricao || '', valor: debt.valor.toString(), valor_recebido: debt.valor_recebido.toString(), status: debt.status, data: debt.data })
    setEditingId(debt.id); setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover essa dívida?')) return
    const { error } = await supabase.from('dividas').delete().eq('id', id)
    if (!error) setDebts(prev => prev.filter(d => d.id !== id))
  }

  const handleMarcarRecebido = async (e: React.MouseEvent, id: string, valor: number) => {
    e.stopPropagation()
    const { data, error } = await supabase.from('dividas').update({ status: 'recebido', valor_recebido: valor }).eq('id', id).select().single()
    if (!error && data) setDebts(prev => prev.map(d => d.id === id ? data : d))
  }

  const filtered = filterStatus === 'todos' ? debts : debts.filter(d => d.status === filterStatus)
  const totalDevido = debts.filter(d => d.status !== 'recebido').reduce((s, d) => s + (d.valor - d.valor_recebido), 0)
  const totalRecebido = debts.filter(d => d.status === 'recebido').reduce((s, d) => s + d.valor, 0)
  const pendentes = debts.filter(d => d.status === 'pendente').length

  return (
    <PageWrapper title="">
      <div className="space-y-5 pb-6">

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Controle</p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-black text-white tracking-tight">Dívidas</h1>
            <button onClick={() => { resetForm(); setIsDialogOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-black text-xs font-bold tracking-widest hover:opacity-90 active:scale-95 transition-all duration-200"
              style={{ background: 'white' }}>
              <Plus className="w-3.5 h-3.5" /> NOVA
            </button>
          </div>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.08s' }}>
          <SpotlightCard glowColor="rgba(239,68,68,0.12)" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>A receber</span>
            </div>
            <p className="text-lg font-black text-red-400">{formatCurrency(totalDevido)}</p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{pendentes} pendente{pendentes !== 1 ? 's' : ''}</p>
          </SpotlightCard>

          <SpotlightCard glowColor="rgba(74,222,128,0.12)" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.1)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Já recebi</span>
            </div>
            <p className="text-lg font-black text-green-400">{formatCurrency(totalRecebido)}</p>
          </SpotlightCard>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(['todos', 'pendente', 'parcial', 'recebido'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="text-[10px] px-3 py-1.5 rounded-full font-bold tracking-widest whitespace-nowrap transition-all duration-200 flex-shrink-0"
              style={{
                background: filterStatus === s ? 'white' : 'rgba(255,255,255,0.05)',
                color: filterStatus === s ? 'black' : 'rgba(255,255,255,0.35)',
                border: filterStatus === s ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}>
              {s === 'todos' ? 'TODOS' : STATUS_LABELS[s].toUpperCase()}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 rounded-full border border-white/10 animate-spin" style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Carregando</p>
          </div>
        ) : filtered.length === 0 ? (
          <SpotlightCard className="p-10 text-center">
            <HandCoins className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma dívida registrada</p>
            <button onClick={() => { resetForm(); setIsDialogOpen(true) }}
              className="text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors">
              + Adicionar primeira dívida
            </button>
          </SpotlightCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((debt, i) => {
              const Icon = STATUS_ICONS[debt.status]
              const falta = debt.valor - debt.valor_recebido
              const pct = debt.valor > 0 ? (debt.valor_recebido / debt.valor) * 100 : 0
              const color = STATUS_COLORS[debt.status]

              return (
                <div key={debt.id} style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)', transition: `all 0.4s ease ${Math.min(i * 0.05, 0.4)}s` }}>
                  <SpotlightCard glowColor={`${color}12`} onClick={() => handleEdit(debt)}>
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-bold text-sm text-white truncate">{debt.devedor}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest"
                              style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
                              {STATUS_LABELS[debt.status].toUpperCase()}
                            </span>
                          </div>
                          {debt.descricao && <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{debt.descricao}</p>}
                          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            {new Date(debt.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-lg text-white">{formatCurrency(debt.valor)}</p>
                          {debt.status === 'parcial' && (
                            <p className="text-[10px] text-yellow-400">falta {formatCurrency(falta)}</p>
                          )}
                        </div>
                      </div>

                      {debt.status === 'parcial' && (
                        <div className="mb-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#eab308', boxShadow: '0 0 8px rgba(234,179,8,0.4)', transition: 'width 0.9s ease' }} />
                        </div>
                      )}

                      {debt.status !== 'recebido' && (
                        <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                          <button onClick={e => handleMarcarRecebido(e, debt.id, debt.valor)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all duration-200 hover:bg-green-500/15"
                            style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
                            <CheckCircle2 className="w-3 h-3" /> MARCAR RECEBIDO
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(debt.id) }}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/10"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                          </button>
                        </div>
                      )}
                    </div>
                  </SpotlightCard>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) resetForm(); setIsDialogOpen(open) }}>
        <DialogContent className="max-w-sm" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <DialogHeader>
            <DialogTitle className="text-white font-black tracking-tight">{editingId ? 'Editar dívida' : 'Nova dívida'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <Field label="Quem te deve *">
              <StyledInput placeholder="Nome da pessoa" value={formData.devedor} onChange={e => setFormData(p => ({ ...p, devedor: e.target.value }))} />
            </Field>
            <Field label="Descrição">
              <StyledInput placeholder="Ex: empréstimo, rolê..." value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor total *">
                <StyledInput type="number" placeholder="0,00" value={formData.valor} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} />
              </Field>
              <Field label="Já recebeu">
                <StyledInput type="number" placeholder="0,00" value={formData.valor_recebido} onChange={e => setFormData(p => ({ ...p, valor_recebido: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data">
                <StyledInput type="date" value={formData.data} onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} />
              </Field>
              <div>
                <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as DebtStatus }))}>
                  <SelectTrigger className="bg-transparent border-0 border-b rounded-none px-0 text-white focus:ring-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { resetForm(); setIsDialogOpen(false) }} className="px-4 py-2 rounded-lg text-xs tracking-widest font-bold hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>CANCELAR</button>
            <button onClick={handleSubmit} disabled={!formData.devedor || !formData.valor || saving} className="px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-200 disabled:opacity-40" style={{ background: 'white', color: 'black' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'SALVAR' : 'ADICIONAR'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
