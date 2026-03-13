import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, CreditCard, Trash2, Edit2, AlertCircle, Loader2, Landmark } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Bank { id: string; name: string }
interface Card {
  id: string; user_id: string; name: string; bank_id: string
  total_limit: number; available_limit: number; current_statement: number
  closing_day: number; due_day: number; created_at: string
}

// ─── Spotlight Card ───────────────────────────────────────────────────────────
function SpotlightCard({ children, className = '', glowColor = 'rgba(74,222,128,0.1)' }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState(false)

  return (
    <div
      ref={ref}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: hover ? 1 : 0, background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 70%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
      {children}
    </div>
  )
}

// ─── Beam Progress ────────────────────────────────────────────────────────────
function BeamProgress({ value, color = '#ef4444', glow = 'rgba(239,68,68,0.5)' }: { value: number; color?: string; glow?: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(Math.min(value, 100)), 120); return () => clearTimeout(t) }, [value])
  const pct = Math.min(w, 100)
  return (
    <div className="relative h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${glow}`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
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
    <input
      {...props}
      className="w-full bg-transparent text-white text-sm placeholder-zinc-700 focus:outline-none py-2.5 px-0 tracking-wide"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', transition: 'border-color 0.2s' }}
      onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.3)')}
      onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)')}
    />
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CartoesPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', bank_id: '', total_limit: '', available_limit: '',
    current_statement: '', closing_day: '', due_day: '',
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [cardsRes, banksRes] = await Promise.all([
      supabase.from('cartoes').select('*').order('created_at', { ascending: true }),
      supabase.from('bancos').select('id, name').order('created_at', { ascending: true }),
    ])
    if (!cardsRes.error && cardsRes.data) setCards(cardsRes.data)
    if (!banksRes.error && banksRes.data) setBanks(banksRes.data)
    setLoading(false)
    setTimeout(() => setMounted(true), 50)
  }

  const resetForm = () => {
    setFormData({ name: '', bank_id: '', total_limit: '', available_limit: '', current_statement: '', closing_day: '', due_day: '' })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.name) return
    setSaving(true)
    const total = parseFloat(formData.total_limit) || 0
    const payload = {
      name: formData.name, bank_id: formData.bank_id || null, total_limit: total,
      available_limit: parseFloat(formData.available_limit) || total,
      current_statement: parseFloat(formData.current_statement) || 0,
      closing_day: parseInt(formData.closing_day) || 1,
      due_day: parseInt(formData.due_day) || 10,
    }
    if (editingId) {
      const { data, error } = await supabase.from('cartoes').update(payload).eq('id', editingId).select().single()
      if (!error && data) setCards(prev => prev.map(c => c.id === editingId ? data : c))
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('cartoes').insert([{ ...payload, user_id: userData.user?.id }]).select().single()
      if (!error && data) setCards(prev => [...prev, data])
    }
    setSaving(false); resetForm(); setIsDialogOpen(false)
  }

  const handleEdit = (card: Card) => {
    setFormData({
      name: card.name, bank_id: card.bank_id || '',
      total_limit: card.total_limit.toString(), available_limit: card.available_limit.toString(),
      current_statement: card.current_statement.toString(),
      closing_day: card.closing_day.toString(), due_day: card.due_day.toString(),
    })
    setEditingId(card.id); setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cartão?')) return
    const { error } = await supabase.from('cartoes').delete().eq('id', id)
    if (!error) setCards(prev => prev.filter(c => c.id !== id))
  }

  const totalDebt = cards.reduce((s, c) => s + c.current_statement, 0)
  const totalLimit = cards.reduce((s, c) => s + c.total_limit, 0)
  const usedLimit = cards.reduce((s, c) => s + (c.total_limit - c.available_limit), 0)
  const usedPct = totalLimit > 0 ? (usedLimit / totalLimit) * 100 : 0

  return (
    <PageWrapper title="">
      <div className="space-y-5 pb-6">

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Gestão</p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-black text-white tracking-tight">Cartões</h1>
            <button
              onClick={() => { resetForm(); setIsDialogOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-black text-xs font-bold tracking-widest transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: 'white' }}
            >
              <Plus className="w-3.5 h-3.5" />
              NOVO
            </button>
          </div>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Hero resumo */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease 0.08s' }}>
          <SpotlightCard glowColor="rgba(239,68,68,0.12)" className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Total a pagar</p>
                <p className="text-3xl font-black text-red-400 tracking-tight">{formatCurrency(totalDebt)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <BeamProgress value={usedPct} color="#ef4444" glow="rgba(239,68,68,0.4)" />
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Usado {formatCurrency(usedLimit)}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Limite {formatCurrency(totalLimit)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Disponível</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(totalLimit - usedLimit)}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Cartões</p>
                <p className="text-sm font-bold text-white">{cards.length}</p>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 rounded-full border border-white/10 animate-spin" style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Carregando</p>
          </div>
        ) : cards.length === 0 ? (
          <SpotlightCard className="p-10 text-center">
            <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum cartão cadastrado</p>
          </SpotlightCard>
        ) : (
          <div className="space-y-3">
            {cards.map((card, i) => {
              const bank = banks.find(b => b.id === card.bank_id)
              const used = card.total_limit - card.available_limit
              const pct = card.total_limit > 0 ? (used / card.total_limit) * 100 : 0
              const alertColor = pct > 80 ? '#ef4444' : pct > 50 ? '#eab308' : '#4ade80'
              const alertGlow = pct > 80 ? 'rgba(239,68,68,0.4)' : pct > 50 ? 'rgba(234,179,8,0.4)' : 'rgba(74,222,128,0.4)'

              return (
                <div key={card.id} style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: `all 0.5s ease ${0.15 + i * 0.07}s` }}>
                  <SpotlightCard glowColor={`${alertColor}18`}>

                    {/* Card header */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <CreditCard className="w-4 h-4 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{card.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {bank && <Landmark className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.25)' }} />}
                          <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{bank?.name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleEdit(card)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <Edit2 className="w-3 h-3 text-white/30" />
                        </button>
                        <button onClick={() => handleDelete(card.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <Trash2 className="w-3 h-3 text-white/30" />
                        </button>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-4 py-3 space-y-3">
                      {/* Fatura */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Fatura atual</p>
                          <p className="text-lg font-black text-red-400">{formatCurrency(card.current_statement)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Vencimento</p>
                          <p className="text-sm font-bold text-white">Dia {card.due_day}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Fecha dia {card.closing_day}</p>
                        </div>
                      </div>

                      {/* Barra de limite */}
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Limite utilizado</span>
                          <span className="text-[10px] font-bold" style={{ color: alertColor }}>{pct.toFixed(0)}%</span>
                        </div>
                        <BeamProgress value={pct} color={alertColor} glow={alertGlow} />
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Usado {formatCurrency(used)}</span>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Disponível {formatCurrency(card.available_limit)}</span>
                        </div>
                      </div>
                    </div>

                  </SpotlightCard>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) resetForm(); setIsDialogOpen(open) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <DialogHeader>
            <DialogTitle className="text-white font-black tracking-tight">
              {editingId ? 'Editar cartão' : 'Novo cartão'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <Field label="Nome do cartão">
              <StyledInput placeholder="Ex: Nubank Platinum" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </Field>

            <Field label="Banco">
              <Select value={formData.bank_id} onValueChange={v => setFormData(p => ({ ...p, bank_id: v }))}>
                <SelectTrigger className="bg-transparent border-0 border-b rounded-none px-0 text-white focus:ring-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Limite total">
                <StyledInput type="number" step="0.01" placeholder="0,00" value={formData.total_limit} onChange={e => setFormData(p => ({ ...p, total_limit: e.target.value }))} />
              </Field>
              <Field label="Limite disponível">
                <StyledInput type="number" step="0.01" placeholder="0,00" value={formData.available_limit} onChange={e => setFormData(p => ({ ...p, available_limit: e.target.value }))} />
              </Field>
            </div>

            <Field label="Fatura atual">
              <StyledInput type="number" step="0.01" placeholder="0,00" value={formData.current_statement} onChange={e => setFormData(p => ({ ...p, current_statement: e.target.value }))} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Dia fechamento">
                <StyledInput type="number" min="1" max="31" placeholder="1" value={formData.closing_day} onChange={e => setFormData(p => ({ ...p, closing_day: e.target.value }))} />
              </Field>
              <Field label="Dia vencimento">
                <StyledInput type="number" min="1" max="31" placeholder="10" value={formData.due_day} onChange={e => setFormData(p => ({ ...p, due_day: e.target.value }))} />
              </Field>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button onClick={() => { resetForm(); setIsDialogOpen(false) }} className="px-4 py-2 rounded-lg text-xs tracking-widest font-bold transition-all duration-200 hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              CANCELAR
            </button>
            <button onClick={handleSubmit} disabled={!formData.name || saving} className="px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-200 disabled:opacity-40" style={{ background: 'white', color: 'black' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'SALVAR' : 'ADICIONAR'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
