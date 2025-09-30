import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export const getWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  const end = endOfWeek(date, { weekStartsOn: 0 })
  return { start, end }
}

export const getMonthRange = (date: Date) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return { start, end }
}

export const getDaysOfWeek = (startDate: Date, endDate: Date) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  return days.map(day => ({
    date: day,
    dayName: format(day, 'EEEE', { locale: ptBR }),
    shortName: format(day, 'EEE', { locale: ptBR })
  }))
}

export const getWeeklyExpenseData = (transactions: any[], startDate: Date, endDate: Date) => {
  const days = getDaysOfWeek(startDate, endDate)
  
  return days.map(day => {
    const dayTransactions = transactions.filter(t => 
      t.type === 'expense' && 
      format(new Date(t.date), 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd')
    )
    
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0)
    
    return {
      day: day.shortName,
      amount: total
    }
  })
}