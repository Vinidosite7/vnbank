import type { Transaction, Bank, CreditCard, Category } from '@/types'
import { getMonthTransactions } from './utils'

export function calculateTotalBalance(banks: Bank[]): number {
  return banks.reduce((total, bank) => total + bank.balance, 0)
}

export function calculateTotalInBanks(banks: Bank[]): number {
  return banks
    .filter(b => b.type === 'personal')
    .reduce((total, bank) => total + bank.balance, 0)
}

export function calculateTotalInBusiness(banks: Bank[]): number {
  return banks
    .filter(b => b.type === 'business')
    .reduce((total, bank) => total + bank.balance, 0)
}

export function calculateTotalCreditCardDebt(cards: CreditCard[]): number {
  return cards.reduce((total, card) => total + card.currentStatement, 0)
}

export function calculateTotalCreditLimit(cards: CreditCard[]): number {
  return cards.reduce((total, card) => total + card.totalLimit, 0)
}

export function calculateUsedCreditLimit(cards: CreditCard[]): number {
  return cards.reduce((total, card) => total + (card.totalLimit - card.availableLimit), 0)
}

export function calculateMonthlyIncome(transactions: Transaction[], month?: string): number {
  const monthTransactions = getMonthTransactions(transactions, month)
  return monthTransactions
    .filter(t => t.type === 'income')
    .reduce((total, t) => total + t.amount, 0)
}

export function calculateMonthlyExpense(transactions: Transaction[], month?: string): number {
  const monthTransactions = getMonthTransactions(transactions, month)
  return monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((total, t) => total + t.amount, 0)
}

export function calculateMonthlyResult(transactions: Transaction[], month?: string): number {
  return calculateMonthlyIncome(transactions, month) - calculateMonthlyExpense(transactions, month)
}

export function getExpensesByCategory(
  transactions: Transaction[],
  categories: Category[],
  month?: string
): { category: Category; total: number }[] {
  const monthTransactions = getMonthTransactions(transactions, month)
  const expenseTransactions = monthTransactions.filter(t => t.type === 'expense')
  
  const categoryMap = new Map<string, number>()
  
  expenseTransactions.forEach(transaction => {
    const current = categoryMap.get(transaction.categoryId) || 0
    categoryMap.set(transaction.categoryId, current + transaction.amount)
  })
  
  return categories
    .filter(c => c.type === 'expense')
    .map(category => ({
      category,
      total: categoryMap.get(category.id) || 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function getTopExpenseCategory(
  transactions: Transaction[],
  categories: Category[],
  month?: string
): { category: Category; total: number } | null {
  const expensesByCategory = getExpensesByCategory(transactions, categories, month)
  return expensesByCategory.length > 0 ? expensesByCategory[0] : null
}

export function calculateProjectedBalance(
  banks: Bank[],
  transactions: Transaction[],
  month?: string
): number {
  const totalBalance = calculateTotalBalance(banks)
  const monthlyResult = calculateMonthlyResult(transactions, month)
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const remainingDays = daysInMonth - today.getDate()
  
  if (remainingDays <= 0) return totalBalance + monthlyResult
  
  const dailyRate = monthlyResult / today.getDate()
  const projectedAdditional = dailyRate * remainingDays
  
  return totalBalance + monthlyResult + projectedAdditional
}

export function calculateCardUsagePercentage(card: CreditCard): number {
  if (card.totalLimit === 0) return 0
  const used = card.totalLimit - card.availableLimit
  return Math.round((used / card.totalLimit) * 100)
}

export function getAvailableBankBalance(banks: Bank[]): number {
  return banks.reduce((total, bank) => total + bank.balance, 0)
}
