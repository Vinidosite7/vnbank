import type { Page } from '@/types'
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tag,
  BarChart3,
  Settings,
  HandCoins,
} from 'lucide-react'

interface BottomNavProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { page: 'cartoes', label: 'Cartões', icon: CreditCard },
  { page: 'transacoes', label: 'Transações', icon: ArrowLeftRight },
  { page: 'categorias', label: 'Categorias', icon: Tag },
  { page: 'resumo', label: 'Resumo', icon: BarChart3 },
  { page: 'dividas', label: 'Dívidas', icon: HandCoins },
  { page: 'config', label: 'Config', icon: Settings },
]

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Top shine */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />

      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.page

          return (
            <button
              key={item.page}
              onClick={() => onPageChange(item.page)}
              className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px] active:scale-90"
              style={{
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
              }}
            >
              <Icon
                className="h-[18px] w-[18px] transition-all duration-200"
                style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.25)' }}
              />
              <span
                className="text-[9px] font-bold tracking-widest transition-all duration-200"
                style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}
              >
                {item.label.toUpperCase().slice(0, 5)}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-px rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
