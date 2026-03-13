import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/finance-store'
import { PageWrapper } from '@/components/layout/PageWrapper'
import {
  Wallet, CreditCard, TrendingDown, TrendingUp,
  PiggyBank, Target, HandCoins, AlertCircle,
  Clock, CheckCircle2, ChevronRight, Zap
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import confetti from 'canvas-confetti'

// ─── Types ───────────────────────────────────────────────────────────────────
type DebtStatus = 'pendente' | 'parcial' | 'recebido'
interface Debt {
  id: string; devedor: string; descricao: string
  valor: number; valor_recebido: number; status: DebtStatus; data: string
}
interface DashData {
  totalBalance: number; totalCreditDebt: number
  monthlyIncome: number; monthlyExpense: number; projectedBalance: number
}

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, className = '' }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(value)

  useEffect(() => {
    const start = ref.current
    const end = value
    const duration = 900
    const startTime = performance.now()

    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(start + (end - start) * ease)
      if (p < 1) requestAnimationFrame(tick)
      else { setDisplay(end); ref.current = end }
    }
    requestAnimationFrame(tick)
  }, [value])

  const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(display))
  const negative = value < 0

  return (
    <span className={className}>
      {negative ? '-' : ''}{'R$ '}{formatted}
    </span>
  )
}

// ─── Spotlight Card ──────────────────────────────────────────────────────────
function SpotlightCard({ children, className = '', glowColor = 'rgba(74,222,128,0.12)' }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0f0f0f] transition-all duration-300 ${className}`}
      style={{ boxShadow: isHovering ? '0 0 0 1px rgba(255,255,255,0.08)' : 'none' }}
    >
      {/* Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 70%)`,
        }}
      />
      {/* Top shine line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  )
}

// ─── Beam Progress ────────────────────────────────────────────────────────────
function BeamProgress({ value, color = '#4ade80', glow = 'rgba(74,222,128,0.5)' }: {
  value: number; color?: string; glow?: string
}) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(value, 100)), 100)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-visible">
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          background: color,
          boxShadow: `0 0 10px ${glow}, 0 0 20px ${glow}`,
        }}
      />
      {/* Moving beam */}
      {width > 5 && (
        <div
          className="absolute top-0 h-full w-8 rounded-full"
          style={{
            left: `${width - 4}%`,
            background: `linear-gradient(90deg, transparent, white, transparent)`,
            opacity: 0.4,
            animation: 'beamPulse 2s ease-in-out infinite',
          }}
        />
      )}
    </div>
  )
}

// ─── Status configs ───────────────────────────────────────────────────────────
const STATUS_ICONS: Record<DebtStatus, typeof Clock> = {
  pendente: AlertCircle, parcial: Clock, recebido: CheckCircle2,
}
const STATUS_COLORS: Record<DebtStatus, string> = {
  pendente: '#ef4444', parcial: '#eab308', recebido: '#4ade80',
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { settings } = useFinanceStore()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<DashData>({
    totalBalance: 0, totalCreditDebt: 0,
    monthlyIncome: 0, monthlyExpense: 0, projectedBalance: 0,
  })
  const [debts, setDebts] = useState<Debt[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const currentMonth = new Date().toISOString().slice(0, 7)

    const [banksRes, cardsRes, txRes, debtsRes] = await Promise.all([
      supabase.from('bancos').select('balance'),
      supabase.from('cartoes').select('current_statement'),
      supabase.from('transacoes').select('type, amount, date').gte('date', `${currentMonth}-01`),
      supabase.from('dividas').select('id, devedor, descricao, valor, valor_recebido, status, data')
        .neq('status', 'recebido').order('data', { ascending: true }).limit(5),
    ])

    const totalBalance = (banksRes.data || []).reduce((s, b) => s + (b.balance || 0), 0)
    const totalCreditDebt = (cardsRes.data || []).reduce((s, c) => s + (c.current_statement || 0), 0)
    const txs = txRes.data || []
    const monthlyIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthlyExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const daysPassed = today.getDate()
    const dailyRate = daysPassed > 0 ? (monthlyIncome - monthlyExpense) / daysPassed : 0
    const projectedBalance = totalBalance + (monthlyIncome - monthlyExpense) + (dailyRate * (daysInMonth - daysPassed))

    setData({ totalBalance, totalCreditDebt, monthlyIncome, monthlyExpense, projectedBalance })
    setDebts(debtsRes.data || [])
    setLoading(false)
    setTimeout(() => setMounted(true), 50)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const lucroAtual = data.monthlyIncome - data.monthlyExpense
  const meta = settings.meta || 0
  const superMeta = settings.superMeta || 0
  const metaPercent = meta > 0 ? Math.min((lucroAtual / meta) * 100, 100) : 0
  const superMetaPercent = superMeta > 0 ? Math.min((lucroAtual / superMeta) * 100, 100) : 0
  const metaBatida = lucroAtual >= meta && meta > 0
  const superMetaBatida = lucroAtual >= superMeta && superMeta > 0

  useEffect(() => {
    if (metaBatida) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
  }, [metaBatida])

  const totalDevido = debts.reduce((s, d) => s + (d.valor - d.valor_recebido), 0)

  const now = new Date()
  const mesNome = now.toLocaleDateString('pt-BR', { month: 'long' })
  const anoAtual = now.getFullYear()

  if (loading) return (
    <PageWrapper title="">
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border border-white/10 animate-spin border-t-green-400" />
          <div className="absolute inset-0 rounded-full bg-green-400/5 blur-xl" />
        </div>
        <p className="text-xs tracking-[0.3em] text-zinc-600 uppercase">Carregando</p>
      </div>
    </PageWrapper>
  )

  return (
    <PageWrapper title="">
      <div className="space-y-5 pb-6">

        {/* ── Header da página ── */}
        <div
          className="transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
        >
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-[10px] tracking-[0.35em] text-zinc-600 uppercase mb-1">Visão geral</p>
              <h1 className="text-2xl font-black text-white tracking-tight capitalize">{mesNome} {anoAtual}</h1>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-zinc-500 tracking-widest">LIVE</span>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mt-4" />
        </div>

        {/* ── Resultado do mês — hero card ── */}
        <div
          className="transition-all duration-700 delay-75"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
        >
          <SpotlightCard
            glowColor={lucroAtual >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)'}
            className="p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.35em] text-zinc-600 uppercase mb-2">Resultado do mês</p>
                <AnimatedNumber
                  value={lucroAtual}
                  className={`text-4xl font-black tracking-tight ${lucroAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}
                />
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: lucroAtual >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)' }}
              >
                {lucroAtual >= 0
                  ? <TrendingUp className="w-5 h-5 text-green-400" />
                  : <TrendingDown className="w-5 h-5 text-red-400" />}
              </div>
            </div>

            {/* Mini stats row */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
              <div>
                <p className="text-[9px] tracking-widest text-zinc-600 uppercase mb-1">Receita</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(data.monthlyIncome)}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-widest text-zinc-600 uppercase mb-1">Despesa</p>
                <p className="text-sm font-bold text-red-400">{formatCurrency(data.monthlyExpense)}</p>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* ── Grid 2 colunas ── */}
        <div
          className="grid grid-cols-2 gap-3 transition-all duration-700 delay-150"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
        >
          {/* Saldo */}
          <SpotlightCard glowColor="rgba(96,165,250,0.15)" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Saldo</span>
            </div>
            <AnimatedNumber
              value={data.totalBalance}
              className="text-base font-bold text-white"
            />
          </SpotlightCard>

          {/* Fatura */}
          <SpotlightCard glowColor="rgba(239,68,68,0.12)" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Fatura</span>
            </div>
            <AnimatedNumber
              value={data.totalCreditDebt}
              className="text-base font-bold text-red-400"
            />
          </SpotlightCard>

          {/* Projeção */}
          <SpotlightCard glowColor="rgba(168,85,247,0.12)" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <PiggyBank className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Projeção</span>
            </div>
            <AnimatedNumber
              value={data.projectedBalance}
              className={`text-base font-bold ${data.projectedBalance >= 0 ? 'text-purple-400' : 'text-red-400'}`}
            />
          </SpotlightCard>

          {/* A receber */}
          <SpotlightCard glowColor="rgba(251,146,60,0.12)" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <HandCoins className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">A receber</span>
            </div>
            <AnimatedNumber
              value={totalDevido}
              className="text-base font-bold text-orange-400"
            />
          </SpotlightCard>
        </div>

        {/* ── Metas ── */}
        {(meta > 0 || superMeta > 0) && (
          <div
            className="transition-all duration-700 delay-200"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
          >
            <SpotlightCard
              glowColor={metaBatida ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.08)'}
              className="p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">Metas do mês</span>
                {metaBatida && (
                  <span className="ml-auto text-[9px] tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> BATIDA
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {meta > 0 && (
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-zinc-500">Meta</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-bold ${metaBatida ? 'text-green-400' : 'text-white'}`}>
                          {formatCurrency(lucroAtual)}
                        </span>
                        <span className="text-[10px] text-zinc-700">/ {formatCurrency(meta)}</span>
                      </div>
                    </div>
                    <BeamProgress
                      value={metaPercent}
                      color={metaBatida ? '#4ade80' : metaPercent >= 80 ? '#facc15' : '#4ade80'}
                      glow={metaBatida ? 'rgba(74,222,128,0.6)' : 'rgba(74,222,128,0.3)'}
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-zinc-700">{metaPercent.toFixed(0)}%</span>
                      <span className="text-[10px] text-zinc-700">
                        {metaBatida ? '🚀 Meta atingida!' : `Faltam ${formatCurrency(meta - lucroAtual)}`}
                      </span>
                    </div>
                  </div>
                )}

                {superMeta > 0 && (
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-zinc-500">Super Meta 🔥</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-bold ${superMetaBatida ? 'text-green-400' : 'text-white'}`}>
                          {formatCurrency(lucroAtual)}
                        </span>
                        <span className="text-[10px] text-zinc-700">/ {formatCurrency(superMeta)}</span>
                      </div>
                    </div>
                    <BeamProgress
                      value={superMetaPercent}
                      color={superMetaBatida ? '#4ade80' : '#f97316'}
                      glow={superMetaBatida ? 'rgba(74,222,128,0.6)' : 'rgba(249,115,22,0.4)'}
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-zinc-700">{superMetaPercent.toFixed(0)}%</span>
                      <span className="text-[10px] text-zinc-700">
                        {superMetaBatida ? '🏆 Super Meta!' : `Faltam ${formatCurrency(superMeta - lucroAtual)}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </SpotlightCard>
          </div>
        )}

        {/* ── Dívidas a receber ── */}
        <div
          className="transition-all duration-700 delay-300"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
        >
          <SpotlightCard glowColor="rgba(251,146,60,0.1)" className="overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-orange-400" />
                <span className="text-xs tracking-[0.25em] text-zinc-400 uppercase">Dívidas a receber</span>
              </div>
              {totalDevido > 0 && (
                <span className="text-xs font-bold text-orange-400">{formatCurrency(totalDevido)}</span>
              )}
            </div>

            {/* Lista */}
            <div className="divide-y divide-white/[0.04]">
              {debts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm text-zinc-600">Nenhuma dívida pendente</p>
                </div>
              ) : (
                debts.map((debt, i) => {
                  const Icon = STATUS_ICONS[debt.status]
                  const falta = debt.valor - debt.valor_recebido
                  const pct = debt.valor > 0 ? (debt.valor_recebido / debt.valor) * 100 : 0
                  const color = STATUS_COLORS[debt.status]

                  return (
                    <div
                      key={debt.id}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-200"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ background: `${color}18` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-sm text-white truncate">{debt.devedor}</span>
                          <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color }}>
                            {formatCurrency(falta)}
                          </span>
                        </div>

                        {debt.status === 'parcial' && (
                          <div className="mt-1.5 mb-1">
                            <BeamProgress value={pct} color="#eab308" glow="rgba(234,179,8,0.4)" />
                          </div>
                        )}

                        {debt.descricao && (
                          <p className="text-[11px] text-zinc-600 truncate">{debt.descricao}</p>
                        )}
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                    </div>
                  )
                })
              )}

              {debts.length === 5 && (
                <div className="px-5 py-3 text-center">
                  <span className="text-[10px] tracking-[0.3em] text-zinc-700 uppercase">Ver todas na aba Dívidas →</span>
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>

      </div>

      <style>{`
        @keyframes beamPulse {
          0%, 100% { opacity: 0.2; transform: scaleX(0.8); }
          50% { opacity: 0.5; transform: scaleX(1.2); }
        }
      `}</style>
    </PageWrapper>
  )
}
