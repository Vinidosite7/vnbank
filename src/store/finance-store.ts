import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bank, CreditCard, Category, Transaction, UserSettings } from '@/types'
import { generateId, getMonthTransactions } from '@/lib/utils'

interface FinanceStore {
  banks: Bank[]
  creditCards: CreditCard[]
  categories: Category[]
  transactions: Transaction[]
  settings: UserSettings

  getCurrentMonthProfit: () => number

  addBank: (bank: Omit<Bank, 'id' | 'createdAt'>) => void
  updateBank: (id: string, bank: Partial<Bank>) => void
  deleteBank: (id: string) => void

  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => void
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void
  deleteCreditCard: (id: string) => void

  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  deleteCategory: (id: string) => void

  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  updateSettings: (settings: Partial<UserSettings>) => void

  resetAllData: () => void
  exportData: () => string
  importData: (jsonData: string) => void
}

const defaultCategories: Category[] = [
  { id: generateId(), name: 'Alimentação', color: '#ef4444', type: 'expense', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Moradia', color: '#f97316', type: 'expense', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Transporte', color: '#eab308', type: 'expense', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Lazer', color: '#22c55e', type: 'expense', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Assinaturas', color: '#06b6d4', type: 'expense', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Investimentos', color: '#8b5cf6', type: 'expense', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Salário', color: '#10b981', type: 'income', createdAt: new Date().toISOString() },
  { id: generateId(), name: 'Freelance', color: '#3b82f6', type: 'income', createdAt: new Date().toISOString() },
]

const defaultSettings: UserSettings = {
  name: '',
  darkMode: false,
  meta: 10000,
  superMeta: 20000,
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      banks: [],
      creditCards: [],
      categories: defaultCategories,
      transactions: [],
      settings: defaultSettings,

      getCurrentMonthProfit: () => {
        const { transactions } = get()
        const monthTxs = getMonthTransactions(transactions)
        const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return income - expense
      },

      addBank: (bank) => {
        const newBank: Bank = {
          ...bank,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ banks: [...state.banks, newBank] }))
      },

      updateBank: (id, bank) => {
        set((state) => ({
          banks: state.banks.map((b) => (b.id === id ? { ...b, ...bank } : b)),
        }))
      },

      deleteBank: (id) => {
        set((state) => ({
          banks: state.banks.filter((b) => b.id !== id),
          creditCards: state.creditCards.filter((c) => c.bankId !== id),
        }))
      },

      addCreditCard: (card) => {
        const newCard: CreditCard = {
          ...card,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ creditCards: [...state.creditCards, newCard] }))
      },

      updateCreditCard: (id, card) => {
        set((state) => ({
          creditCards: state.creditCards.map((c) => (c.id === id ? { ...c, ...card } : c)),
        }))
      },

      deleteCreditCard: (id) => {
        set((state) => ({
          creditCards: state.creditCards.filter((c) => c.id !== id),
        }))
      },

      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ categories: [...state.categories, newCategory] }))
      },

      updateCategory: (id, category) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }))
      },

      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }

        set((state) => {
          const newTransactions = [...state.transactions, newTransaction]

          let updatedBanks = state.banks
          let updatedCards = state.creditCards

          if (transaction.paymentMethod === 'bank' && transaction.bankId) {
            updatedBanks = state.banks.map((b) =>
              b.id === transaction.bankId
                ? {
                    ...b,
                    balance:
                      transaction.type === 'income'
                        ? b.balance + transaction.amount
                        : b.balance - transaction.amount,
                  }
                : b
            )
          }

          if (
            transaction.paymentMethod === 'credit_card' &&
            transaction.cardId &&
            transaction.type === 'expense'
          ) {
            updatedCards = state.creditCards.map((c) =>
              c.id === transaction.cardId
                ? {
                    ...c,
                    currentStatement: c.currentStatement + transaction.amount,
                    availableLimit: c.availableLimit - transaction.amount,
                  }
                : c
            )
          }

          return {
            transactions: newTransactions,
            banks: updatedBanks,
            creditCards: updatedCards,
          }
        })
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const oldTransaction = state.transactions.find(t => t.id === id)
          if (!oldTransaction) return state

          const newTransaction = { ...oldTransaction, ...updates }
          const newTransactions = state.transactions.map((t) =>
            t.id === id ? newTransaction : t
          )

          let updatedBanks = state.banks
          let updatedCards = state.creditCards

          // Reverter efeito da transação antiga no banco
          if (oldTransaction.paymentMethod === 'bank' && oldTransaction.bankId) {
            updatedBanks = updatedBanks.map((b) =>
              b.id === oldTransaction.bankId
                ? {
                    ...b,
                    balance: oldTransaction.type === 'income'
                      ? b.balance - oldTransaction.amount
                      : b.balance + oldTransaction.amount,
                  }
                : b
            )
          }
          if (oldTransaction.paymentMethod === 'credit_card' && oldTransaction.cardId && oldTransaction.type === 'expense') {
            updatedCards = updatedCards.map((c) =>
              c.id === oldTransaction.cardId
                ? {
                    ...c,
                    currentStatement: c.currentStatement - oldTransaction.amount,
                    availableLimit: c.availableLimit + oldTransaction.amount,
                  }
                : c
            )
          }

          // Aplicar efeito da nova transação
          if (newTransaction.paymentMethod === 'bank' && newTransaction.bankId) {
            updatedBanks = updatedBanks.map((b) =>
              b.id === newTransaction.bankId
                ? {
                    ...b,
                    balance: newTransaction.type === 'income'
                      ? b.balance + newTransaction.amount
                      : b.balance - newTransaction.amount,
                  }
                : b
            )
          }
          if (newTransaction.paymentMethod === 'credit_card' && newTransaction.cardId && newTransaction.type === 'expense') {
            updatedCards = updatedCards.map((c) =>
              c.id === newTransaction.cardId
                ? {
                    ...c,
                    currentStatement: c.currentStatement + newTransaction.amount,
                    availableLimit: c.availableLimit - newTransaction.amount,
                  }
                : c
            )
          }

          return {
            transactions: newTransactions,
            banks: updatedBanks,
            creditCards: updatedCards,
          }
        })
      },

      deleteTransaction: (id) => {
        set((state) => {
          const transaction = state.transactions.find(t => t.id === id)
          if (!transaction) return state

          const newTransactions = state.transactions.filter((t) => t.id !== id)

          let updatedBanks = state.banks
          let updatedCards = state.creditCards

          if (transaction.paymentMethod === 'bank' && transaction.bankId) {
            updatedBanks = state.banks.map((b) =>
              b.id === transaction.bankId
                ? {
                    ...b,
                    balance:
                      transaction.type === 'income'
                        ? b.balance - transaction.amount
                        : b.balance + transaction.amount,
                  }
                : b
            )
          }

          if (
            transaction.paymentMethod === 'credit_card' &&
            transaction.cardId &&
            transaction.type === 'expense'
          ) {
            updatedCards = state.creditCards.map((c) =>
              c.id === transaction.cardId
                ? {
                    ...c,
                    currentStatement: c.currentStatement - transaction.amount,
                    availableLimit: c.availableLimit + transaction.amount,
                  }
                : c
            )
          }

          return {
            transactions: newTransactions,
            banks: updatedBanks,
            creditCards: updatedCards,
          }
        })
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }))
      },

      resetAllData: () => {
        set({
          banks: [],
          creditCards: [],
          categories: defaultCategories,
          transactions: [],
          settings: defaultSettings,
        })
      },

      exportData: () => {
        const state = get()
        return JSON.stringify(
          {
            banks: state.banks,
            creditCards: state.creditCards,
            categories: state.categories,
            transactions: state.transactions,
            settings: state.settings,
          },
          null,
          2
        )
      },

      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData)
          set({
            banks: data.banks || [],
            creditCards: data.creditCards || [],
            categories: data.categories || defaultCategories,
            transactions: data.transactions || [],
            settings: data.settings || defaultSettings,
          })
        } catch (error) {
          console.error('Error importing data:', error)
          throw new Error('Invalid data format')
        }
      },
    }),
    {
      name: 'minimal-finance-storage',
    }
  )
)
