import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit2, ArrowDownLeft, ArrowUpRight, Loader2, Landmark, Briefcase, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string; user_id: string; name: string; color: string
  type: 'income' | 'expense'; created_at: string
}
interface Bank {
  id: string; user_id: string; name: string; balance: number
  type: 'personal' | 'business'; created_at: string
}

const presetColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
]

const defaultCategories = [
  { name: 'Alimentação', color: '#ef4444', type: 'expense' as const },
  { name: 'Moradia', color: '#f97316', type: 'expense' as const },
  { name: 'Transporte', color: '#eab308', type: 'expense' as const },
  { name: 'Lazer', color: '#22c55e', type: 'expense' as const },
  { name: 'Assinaturas', color: '#06b6d4', type: 'expense' as const },
  { name: 'Investimentos', color: '#8b5cf6', type: 'expense' as const },
  { name: 'Salário', color: '#10b981', type: 'income' as const },
  { name: 'Freelance', color: '#3b82f6', type: 'income' as const },
]

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

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [isCatOpen, setIsCatOpen] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState({ name: '', color: presetColors[0], type: 'expense' as 'income' | 'expense' })

  const [isBankOpen, setIsBankOpen] = useState(false)
  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [bankForm, setBankForm] = useState({ name: '', balance: '', type: 'personal' as 'personal' | 'business' })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [catRes, bankRes] = await Promise.all([
      supabase.from('categorias').select('*').order('created_at', { ascending: true }),
      supabase.from('bancos').select('*').order('created_at', { ascending: true }),
    ])
    if (!catRes.error && catRes.data) {
      if (catRes.data.length === 0) await seedDefaults()
      else setCategories(catRes.data)
    }
    if (!bankRes.error && bankRes.data) setBanks(bankRes.data)
    setLoading(false)
    setTimeout(() => setMounted(true), 50)
  }

  async function seedDefaults() {
    const { data: userData } = await supabase.auth.getUser()
    const toInsert = defaultCategories.map(c => ({ ...c, user_id: userData.user?.id }))
    const { data, error } = await supabase.from('categorias').insert(toInsert).select()
    if (!error && data) setCategories(data)
  }

  const resetCat = () => { setCatForm({ name: '', color: presetColors[0], type: 'expense' }); setEditingCatId(null) }
  const handleCatSubmit = async () => {
    if (!catForm.name) return
    setSaving(true)
    const payload = { name: catForm.name, color: catForm.color, type: catForm.type }
    if (editingCatId) {
      const { data, error } = await supabase.from('categorias').update(payload).eq('id', editingCatId).select().single()
      if (!error && data) setCategories(prev => prev.map(c => c.id === editingCatId ? data : c))
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('categorias').insert([{ ...payload, user_id: userData.user?.id }]).select().single()
      if (!error && data) setCategories(prev => [...prev, data])
    }
    setSaving(false); resetCat(); setIsCatOpen(false)
  }
  const handleCatEdit = (cat: Category) => { setCatForm({ name: cat.name, color: cat.color, type: cat.type }); setEditingCatId(cat.id); setIsCatOpen(true) }
  const handleCatDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (!error) setCategories(prev => prev.filter(c => c.id !== id))
  }

  const resetBank = () => { setBankForm({ name: '', balance: '', type: 'personal' }); setEditingBankId(null) }
  const handleBankSubmit = async () => {
    if (!bankForm.name) return
    setSaving(true)
    const payload = { name: bankForm.name, balance: parseFloat(bankForm.balance) || 0, type: bankForm.type }
    if (editingBankId) {
      const { data, error } = await supabase.from('bancos').update(payload).eq('id', editingBankId).select().single()
      if (!error && data) setBanks(prev => prev.map(b => b.id === editingBankId ? data : b))
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('bancos').insert([{ ...payload, user_id: userData.user?.id }]).select().single()
      if (!error && data) setBanks(prev => [...prev, data])
    }
    setSaving(false); resetBank(); setIsBankOpen(false)
  }
  const handleBankEdit = (bank: Bank) => { setBankForm({ name: bank.name, balance: bank.balance.toString(), type: bank.type }); setEditingBankId(bank.id); setIsBankOpen(true) }
  const handleBankDelete = async (id: string) => {
    if (!confirm('Excluir este banco?')) return
    const { error } = await supabase.from('bancos').delete().eq('id', id)
    if (!error) setBanks(prev => prev.filter(b => b.id !== id))
  }

  const expense = categories.filter(c => c.type === 'expense')
  const income = categories.filter(c => c.type === 'income')
  const totalBalance = banks.reduce((s, b) => s + b.balance, 0)

  const CatSection = ({ items, type }: { items: Category[]; type: 'income' | 'expense' }) => (
    <SpotlightCard glowColor={type === 'income' ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)'} className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: type === 'income' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {type === 'income' ? <ArrowDownLeft className="w-3 h-3 text-green-400" /> : <ArrowUpRight className="w-3 h-3 text-red-400" />}
          </div>
          <span className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: type === 'income' ? 'rgba(74,222,128,0.7)' : 'rgba(239,68,68,0.7)' }}>
            {type === 'income' ? 'Receitas' : 'Despesas'}
          </span>
          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{items.length}</span>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {items.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>Nenhuma categoria</p>
        ) : items.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-8px)', transition: `all 0.4s ease ${0.1 + i * 0.05}s` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}18` }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}80` }} />
            </div>
            <span className="flex-1 text-sm font-medium text-white truncate">{cat.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleCatEdit(cat)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Edit2 className="w-3 h-3 text-white/30" />
              </button>
              <button onClick={() => handleCatDelete(cat.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Trash2 className="w-3 h-3 text-white/30" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </SpotlightCard>
  )

  return (
    <PageWrapper title="">
      <div className="space-y-5 pb-6">

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Organização</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Categorias & Bancos</h1>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 rounded-full border border-white/10 animate-spin" style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Carregando</p>
          </div>
        ) : (
          <div className="space-y-3" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>

            {/* BANCOS */}
            <SpotlightCard glowColor="rgba(96,165,250,0.1)" className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)' }}>
                    <Landmark className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-blue-400/70">Bancos</span>
                  <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{banks.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  {banks.length > 0 && (
                    <span className={`text-xs font-black ${totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(totalBalance)}
                    </span>
                  )}
                  <button onClick={() => { resetBank(); setIsBankOpen(true) }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest hover:bg-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Plus className="w-2.5 h-2.5" /> NOVO
                  </button>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {banks.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Landmark className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.08)' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Nenhum banco cadastrado</p>
                    <button onClick={() => { resetBank(); setIsBankOpen(true) }} className="mt-1 text-[10px] tracking-widest text-blue-400/60 hover:text-blue-400 transition-colors">
                      + Adicionar primeiro banco
                    </button>
                  </div>
                ) : banks.map((bank, i) => (
                  <div key={bank.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                    style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-8px)', transition: `all 0.4s ease ${0.1 + i * 0.05}s` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.08)' }}>
                      {bank.type === 'business' ? <Briefcase className="w-3.5 h-3.5 text-blue-400/60" /> : <User className="w-3.5 h-3.5 text-blue-400/60" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{bank.name}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{bank.type === 'business' ? 'PJ' : 'Pessoal'}</p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${bank.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(bank.balance)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleBankEdit(bank)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Edit2 className="w-3 h-3 text-white/30" />
                      </button>
                      <button onClick={() => handleBankDelete(bank.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Trash2 className="w-3 h-3 text-white/30" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            {/* Separador com botão nova categoria */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <button onClick={() => { resetCat(); setIsCatOpen(true) }}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Plus className="w-2.5 h-2.5" /> CATEGORIA
              </button>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            <CatSection items={expense} type="expense" />
            <CatSection items={income} type="income" />
          </div>
        )}
      </div>

      {/* Dialog Categoria */}
      <Dialog open={isCatOpen} onOpenChange={open => { if (!open) resetCat(); setIsCatOpen(open) }}>
        <DialogContent style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <DialogHeader>
            <DialogTitle className="text-white font-black tracking-tight">{editingCatId ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Tipo</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {(['expense', 'income'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setCatForm(p => ({ ...p, type: t }))}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all duration-200"
                    style={{
                      background: catForm.type === t ? (t === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)') : 'transparent',
                      color: catForm.type === t ? (t === 'expense' ? '#f87171' : '#4ade80') : 'rgba(255,255,255,0.3)',
                      border: catForm.type === t ? `1px solid ${t === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}` : '1px solid transparent',
                    }}>
                    {t === 'expense' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                    {t === 'expense' ? 'DESPESA' : 'RECEITA'}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Nome">
              <StyledInput placeholder="Ex: Alimentação" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <div>
              <label className="block text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Cor</label>
              <div className="grid grid-cols-5 gap-2">
                {presetColors.map(color => (
                  <button key={color} type="button" onClick={() => setCatForm(p => ({ ...p, color }))}
                    className="w-full aspect-square rounded-lg transition-all duration-200"
                    style={{ backgroundColor: color, boxShadow: catForm.color === color ? `0 0 12px ${color}80, 0 0 0 2px white` : 'none', transform: catForm.color === color ? 'scale(1.1)' : 'scale(1)', opacity: catForm.color === color ? 1 : 0.6 }} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: catForm.color, boxShadow: `0 0 8px ${catForm.color}` }} />
                <span className="text-xs text-white/50">{catForm.name || 'Preview'}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { resetCat(); setIsCatOpen(false) }} className="px-4 py-2 rounded-lg text-xs tracking-widest font-bold hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>CANCELAR</button>
            <button onClick={handleCatSubmit} disabled={!catForm.name || saving} className="px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-200 disabled:opacity-40" style={{ background: 'white', color: 'black' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCatId ? 'SALVAR' : 'ADICIONAR'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Banco */}
      <Dialog open={isBankOpen} onOpenChange={open => { if (!open) resetBank(); setIsBankOpen(open) }}>
        <DialogContent style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <DialogHeader>
            <DialogTitle className="text-white font-black tracking-tight">{editingBankId ? 'Editar banco' : 'Novo banco'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <Field label="Nome do banco">
              <StyledInput placeholder="Ex: Nubank, Itaú, Inter..." value={bankForm.name} onChange={e => setBankForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Saldo atual">
              <StyledInput type="number" step="0.01" placeholder="0,00" value={bankForm.balance} onChange={e => setBankForm(p => ({ ...p, balance: e.target.value }))} />
            </Field>
            <div>
              <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Tipo</label>
              <Select value={bankForm.type} onValueChange={v => setBankForm(p => ({ ...p, type: v as 'personal' | 'business' }))}>
                <SelectTrigger className="bg-transparent border-0 border-b rounded-none px-0 text-white focus:ring-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="business">PJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { resetBank(); setIsBankOpen(false) }} className="px-4 py-2 rounded-lg text-xs tracking-widest font-bold hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>CANCELAR</button>
            <button onClick={handleBankSubmit} disabled={!bankForm.name || saving} className="px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-200 disabled:opacity-40" style={{ background: 'white', color: 'black' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBankId ? 'SALVAR' : 'ADICIONAR'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
