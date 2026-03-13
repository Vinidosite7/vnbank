import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ArrowDownLeft, ArrowUpRight, Trash2, Repeat, CreditCard, Landmark, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Category { id: string; name: string; color: string; type: string }
interface Bank { id: string; name: string }
interface CardItem { id: string; name: string }
interface Transaction {
  id: string; type: 'income' | 'expense'; amount: number; date: string
  category_id: string; payment_method: 'bank' | 'credit_card'
  bank_id?: string; card_id?: string; description?: string
  is_recurring: boolean; created_at: string
}

// ─── Shared components ────────────────────────────────────────────────────────
function SpotlightCard({ children, className = '', glowColor = 'rgba(255,255,255,0.05)' }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState(false)
  return (
    <div ref={ref}
      onMouseMove={e => { const r = ref.current?.getBoundingClientRect(); if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={`relative overflow-hidden rounded-xl ${className}`}
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TransacoesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [cardItems, setCardItems] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '', date: new Date().toISOString().split('T')[0],
    category_id: '', payment_method: 'bank' as 'bank' | 'credit_card',
    bank_id: '', card_id: '', description: '', is_recurring: false,
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [txRes, catRes, bankRes, cardRes] = await Promise.all([
      supabase.from('transacoes').select('*').order('date', { ascending: false }),
      supabase.from('categorias').select('id, name, color, type').order('name'),
      supabase.from('bancos').select('id, name').order('name'),
      supabase.from('cartoes').select('id, name').order('name'),
    ])
    if (!txRes.error && txRes.data) setTransactions(txRes.data)
    if (!catRes.error && catRes.data) setCategories(catRes.data)
    if (!bankRes.error && bankRes.data) setBanks(bankRes.data)
    if (!cardRes.error && cardRes.data) setCardItems(cardRes.data)
    setLoading(false)
    setTimeout(() => setMounted(true), 50)
  }

  const resetForm = () => setFormData({
    type: 'expense', amount: '', date: new Date().toISOString().split('T')[0],
    category_id: '', payment_method: 'bank', bank_id: '', card_id: '', description: '', is_recurring: false,
  })

  const handleSubmit = async () => {
    if (!formData.amount) return
    setSaving(true)
    const payload = {
      type: formData.type, amount: parseFloat(formData.amount) || 0,
      date: formData.date, category_id: formData.category_id || null,
      payment_method: formData.payment_method,
      bank_id: formData.payment_method === 'bank' ? formData.bank_id || null : null,
      card_id: formData.payment_method === 'credit_card' ? formData.card_id || null : null,
      description: formData.description || null, is_recurring: formData.is_recurring,
    }
    const { data: userData } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('transacoes').insert([{ ...payload, user_id: userData.user?.id }]).select().single()
    if (!error && data) {
      setTransactions(prev => [data, ...prev])
      if (payload.payment_method === 'bank' && payload.bank_id) {
        const { data: bankData } = await supabase.from('bancos').select('balance').eq('id', payload.bank_id).single()
        if (bankData) {
          const delta = payload.type === 'income' ? payload.amount : -payload.amount
          await supabase.from('bancos').update({ balance: (bankData.balance || 0) + delta }).eq('id', payload.bank_id)
        }
      }
      if (payload.payment_method === 'credit_card' && payload.card_id && payload.type === 'expense') {
        const { data: cardData } = await supabase.from('cartoes').select('current_statement, available_limit').eq('id', payload.card_id).single()
        if (cardData) {
          await supabase.from('cartoes').update({
            current_statement: (cardData.current_statement || 0) + payload.amount,
            available_limit: (cardData.available_limit || 0) - payload.amount,
          }).eq('id', payload.card_id)
        }
      }
    }
    setSaving(false); resetForm(); setIsDialogOpen(false)
  }

  const handleDelete = async (tx: Transaction) => {
    if (!confirm('Excluir esta transação?')) return
    const { error } = await supabase.from('transacoes').delete().eq('id', tx.id)
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== tx.id))
      if (tx.payment_method === 'bank' && tx.bank_id) {
        const { data: bankData } = await supabase.from('bancos').select('balance').eq('id', tx.bank_id).single()
        if (bankData) {
          const delta = tx.type === 'income' ? -tx.amount : tx.amount
          await supabase.from('bancos').update({ balance: (bankData.balance || 0) + delta }).eq('id', tx.bank_id)
        }
      }
      if (tx.payment_method === 'credit_card' && tx.card_id && tx.type === 'expense') {
        const { data: cardData } = await supabase.from('cartoes').select('current_statement, available_limit').eq('id', tx.card_id).single()
        if (cardData) {
          await supabase.from('cartoes').update({
            current_statement: (cardData.current_statement || 0) - tx.amount,
            available_limit: (cardData.available_limit || 0) + tx.amount,
          }).eq('id', tx.card_id)
        }
      }
    }
  }

  const months = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort((a, b) => b.localeCompare(a))
  const filtered = transactions.filter(t => t.date.startsWith(filterMonth))
  const monthlyIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthlyExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const lucro = monthlyIncome - monthlyExpense

  const getCat = (id: string) => categories.find(c => c.id === id)
  const getBank = (id: string) => banks.find(b => b.id === id)
  const getCard = (id: string) => cardItems.find(c => c.id === id)

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-')
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
  }

  return (
    <PageWrapper title="">
      <div className="space-y-5 pb-6">

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Histórico</p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-black text-white tracking-tight">Transações</h1>
            <button onClick={() => { resetForm(); setIsDialogOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-black text-xs font-bold tracking-widest transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: 'white' }}>
              <Plus className="w-3.5 h-3.5" /> NOVA
            </button>
          </div>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Resumo do mês */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease 0.08s' }}>
          <SpotlightCard glowColor={lucro >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'} className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Receitas</p>
                <p className="text-sm font-black text-green-400">{formatCurrency(monthlyIncome)}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Despesas</p>
                <p className="text-sm font-black text-red-400">{formatCurrency(monthlyExpense)}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Resultado</p>
                <p className={`text-sm font-black ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(lucro)}</p>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Filtro meses — pill scroll */}
        {months.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {months.map(m => (
              <button key={m} onClick={() => setFilterMonth(m)}
                className="text-[10px] px-3 py-1.5 rounded-full font-bold tracking-widest whitespace-nowrap transition-all duration-200 flex-shrink-0"
                style={{
                  background: filterMonth === m ? 'white' : 'rgba(255,255,255,0.05)',
                  color: filterMonth === m ? 'black' : 'rgba(255,255,255,0.35)',
                  border: filterMonth === m ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}>
                {monthLabel(m)}
              </button>
            ))}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 rounded-full border border-white/10 animate-spin" style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Carregando</p>
          </div>
        ) : filtered.length === 0 ? (
          <SpotlightCard className="p-10 text-center">
            <ArrowUpRight className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma transação neste mês</p>
          </SpotlightCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const cat = getCat(tx.category_id)
              const isIncome = tx.type === 'income'
              return (
                <div key={tx.id} style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)', transition: `all 0.4s ease ${Math.min(i * 0.04, 0.4)}s` }}>
                  <SpotlightCard glowColor={isIncome ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)'}>
                    <div className="flex items-center gap-3 px-4 py-3">

                      {/* Ícone */}
                      <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{ background: isIncome ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)' }}>
                        {isIncome
                          ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {cat && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color, boxShadow: `0 0 4px ${cat.color}` }} />}
                          <span className="text-sm font-semibold text-white truncate">{cat?.name || 'Sem categoria'}</span>
                          {tx.is_recurring && <Repeat className="w-2.5 h-2.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDate(tx.date)}</span>
                          {tx.payment_method === 'bank' && tx.bank_id && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                              <Landmark className="w-2.5 h-2.5" />{getBank(tx.bank_id)?.name}
                            </span>
                          )}
                          {tx.payment_method === 'credit_card' && tx.card_id && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                              <CreditCard className="w-2.5 h-2.5" />{getCard(tx.card_id)?.name}
                            </span>
                          )}
                        </div>
                        {tx.description && <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{tx.description}</p>}
                      </div>

                      {/* Valor + delete */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-sm font-black ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button onClick={() => handleDelete(tx)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/10"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <Trash2 className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </button>
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
            <DialogTitle className="text-white font-black tracking-tight">Nova transação</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">

            {/* Tipo toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} type="button" onClick={() => setFormData(p => ({ ...p, type: t, ...(t === 'income' ? { payment_method: 'bank', card_id: '' } : {}) }))}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all duration-200"
                  style={{
                    background: formData.type === t ? (t === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)') : 'transparent',
                    color: formData.type === t ? (t === 'expense' ? '#f87171' : '#4ade80') : 'rgba(255,255,255,0.3)',
                    border: formData.type === t ? `1px solid ${t === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}` : '1px solid transparent',
                  }}>
                  {t === 'expense' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                  {t === 'expense' ? 'DESPESA' : 'RECEITA'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor">
                <StyledInput type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} />
              </Field>
              <Field label="Data">
                <StyledInput type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
              </Field>
            </div>

            <Field label="Categoria">
              <Select value={formData.category_id} onValueChange={v => setFormData(p => ({ ...p, category_id: v }))}>
                <SelectTrigger className="bg-transparent border-0 border-b rounded-none px-0 text-white focus:ring-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {categories.filter(c => c.type === formData.type).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Forma de pagamento */}
            <div>
              <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {(['bank', 'credit_card'] as const).map(m => (
                  <button key={m} type="button"
                    disabled={m === 'credit_card' && formData.type === 'income'}
                    onClick={() => setFormData(p => ({ ...p, payment_method: m, ...(m === 'bank' ? { card_id: '' } : { bank_id: '' }) }))}
                    className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: formData.payment_method === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: formData.payment_method === m ? 'white' : 'rgba(255,255,255,0.3)',
                      border: formData.payment_method === m ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    }}>
                    {m === 'bank' ? <Landmark className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                    {m === 'bank' ? 'BANCO' : 'CARTÃO'}
                  </button>
                ))}
              </div>
            </div>

            {formData.payment_method === 'bank' ? (
              <Field label="Banco">
                <Select value={formData.bank_id} onValueChange={v => setFormData(p => ({ ...p, bank_id: v }))}>
                  <SelectTrigger className="bg-transparent border-0 border-b rounded-none px-0 text-white focus:ring-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <Field label="Cartão">
                <Select value={formData.card_id} onValueChange={v => setFormData(p => ({ ...p, card_id: v }))}>
                  <SelectTrigger className="bg-transparent border-0 border-b rounded-none px-0 text-white focus:ring-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {cardItems.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field label="Descrição (opcional)">
              <StyledInput placeholder="Ex: Almoço com amigos" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            </Field>

            {/* Recorrente */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-10 h-5 flex-shrink-0">
                <input type="checkbox" className="sr-only" checked={formData.is_recurring} onChange={e => setFormData(p => ({ ...p, is_recurring: e.target.checked }))} />
                <div className="w-10 h-5 rounded-full transition-all duration-200" style={{ background: formData.is_recurring ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)', border: `1px solid ${formData.is_recurring ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}` }} />
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200" style={{ left: formData.is_recurring ? '22px' : '2px' }} />
              </div>
              <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>RECORRENTE MENSAL</span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <button onClick={() => { resetForm(); setIsDialogOpen(false) }}
              className="px-4 py-2 rounded-lg text-xs tracking-widest font-bold transition-all duration-200 hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              CANCELAR
            </button>
            <button onClick={handleSubmit} disabled={!formData.amount || saving}
              className="px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-200 disabled:opacity-40"
              style={{ background: 'white', color: 'black' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ADICIONAR'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
