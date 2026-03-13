export interface Bank {
  id: string
  name: string
  balance: number
  type: 'personal' | 'business'
  createdAt: string
}

export interface CreditCard {
  id: string
  name: string
  bankId: string
  totalLimit: number
  availableLimit: number
  currentStatement: number
  closingDay: number
  dueDay: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  type: 'income' | 'expense'
  createdAt: string
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  categoryId: string
  paymentMethod: 'bank' | 'credit_card'
  bankId?: string
  cardId?: string
  description?: string
  isRecurring: boolean
  createdAt: string
}

export interface UserSettings {
  name: string
  darkMode: boolean
  meta?: number
  superMeta?: number
  diasAviso?: number  // days before card due date to send notification (default 3)
}

export interface FinanceState {
  banks: Bank[]
  creditCards: CreditCard[]
  categories: Category[]
  transactions: Transaction[]
  settings: UserSettings
}

export type Page = 'dashboard' | 'cartoes' | 'transacoes' | 'categorias' | 'resumo' | 'dividas' | 'config'
