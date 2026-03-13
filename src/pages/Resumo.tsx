import { useState, useEffect, useRef } from 'react'
import { useFinanceStore } from '@/store/finance-store'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TrendingUp, TrendingDown, CreditCard, Landmark, Tag, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  calculateMonthlyIncome, calculateMonthlyExpense, calculateMonthlyResult,
  calculateTotalCreditCardDebt, getAvailableBankBalance,
  getTopExpenseCategory, getExpensesByCategory,
} from '@/lib/financial-calculations'

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

function BeamProgress({ value, color = '#4ade80', glow = 'rgba(74,222,128,0.4)' }: { value: number; color?: string; glow?: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(value, 100)), 100)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div className="relative h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${glow}`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

export default function ResumoPage() {
  const { transactions, categories, banks, creditCards } = useFinanceStore()

  const monthlyIncome = calculateMonthlyIncome(transactions)
  const monthlyExpense = calculateMonthlyExpense(transactions)
  const monthlyResult = calculateMonthlyResult(transactions)
  const totalCreditDebt = calculateTotalCreditCardDebt(creditCards)
  const availableBankBalance = getAvailableBankBalance(banks)
  const topExpenseCategory = getTopExpenseCategory(transactions, categories)
  const expensesByCategory = getExpensesByCategory(transactions, categories).filter(i => i.total > 0)

  const savingsRate = monthlyIncome > 0 ? (monthlyResult / monthlyIncome) * 100 : 0
  const expenseRate = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0
  const netBalance = availableBankBalance - totalCreditDebt

  const now = new Date()
  const mesNome = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <PageWrapper title="">
      <div className="space-y-4 pb-6">

        {/* Header */}
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Análise</p>
          <h1 className="text-2xl font-black text-white tracking-tight capitalize">{mesNome}</h1>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Hero resultado */}
        <SpotlightCard glowColor={monthlyResult >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)'} className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Resultado do mês</p>
              <p className={`text-4xl font-black tracking-tight ${monthlyResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(monthlyResult)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: monthlyResult >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {monthlyResult >= 0
                ? <TrendingUp className="w-5 h-5 text-green-400" />
                : <TrendingDown className="w-5 h-5 text-red-400" />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Receitas</p>
              <p className="text-sm font-black text-green-400">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Despesas</p>
              <p className="text-sm font-black text-red-400">{formatCurrency(monthlyExpense)}</p>
            </div>
          </div>
        </SpotlightCard>

        {/* Detalhamento */}
        <SpotlightCard glowColor="rgba(96,165,250,0.08)" className="overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Detalhamento</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { icon: CreditCard, label: 'Cartões de crédito', sub: 'Total a pagar', value: totalCreditDebt, color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
              { icon: Landmark, label: 'Saldo em bancos', sub: 'Disponível', value: availableBankBalance, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
              { icon: Tag, label: topExpenseCategory?.category.name || 'Maior gasto', sub: 'Categoria top', value: topExpenseCategory?.total || 0, color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
            ].map(({ icon: Icon, label, sub, value, color, bg }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                </div>
                <span className="text-sm font-black flex-shrink-0" style={{ color }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* Gastos por categoria */}
        <SpotlightCard glowColor="rgba(239,68,68,0.08)" className="overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Gastos por categoria</p>
          </div>
          {expensesByCategory.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <AlertCircle className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.08)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Nenhuma despesa este mês</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {expensesByCategory.map((item, i) => {
                const pct = monthlyExpense > 0 ? (item.total / monthlyExpense) * 100 : 0
                return (
                  <div key={item.category.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold w-5" style={{ color: 'rgba(255,255,255,0.2)' }}>{i + 1}º</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.category.color, boxShadow: `0 0 6px ${item.category.color}` }} />
                      <span className="flex-1 text-sm font-medium text-white truncate">{item.category.name}</span>
                      <span className="text-sm font-black text-white">{formatCurrency(item.total)}</span>
                      <span className="text-[10px] w-9 text-right font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{pct.toFixed(0)}%</span>
                    </div>
                    <BeamProgress value={pct} color={item.category.color} glow={`${item.category.color}60`} />
                  </div>
                )
              })}
            </div>
          )}
        </SpotlightCard>

        {/* Saúde financeira */}
        <SpotlightCard glowColor={savingsRate >= 20 ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)'} className="overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Saúde financeira</p>
          </div>
          <div className="p-4 space-y-4">
            {[
              { label: 'Taxa de economia', value: `${savingsRate.toFixed(1)}%`, good: savingsRate >= 20, sub: savingsRate >= 20 ? 'Ótimo' : savingsRate >= 10 ? 'Regular' : 'Atenção' },
              { label: 'Relação despesa/receita', value: `${expenseRate.toFixed(1)}%`, good: expenseRate <= 80, sub: expenseRate <= 80 ? 'Controlado' : 'Alto' },
              { label: 'Saldo líquido', value: formatCurrency(netBalance), good: netBalance >= 0, sub: 'Bancos − Cartões' },
            ].map(({ label, value, good, sub }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full`}
                  style={{
                    color: good ? '#4ade80' : '#f87171',
                    background: good ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${good ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </SpotlightCard>

      </div>
    </PageWrapper>
  )
}
