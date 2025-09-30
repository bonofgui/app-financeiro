// Tipos para o app MÃE NA LINHA

export interface FamilyMember {
  id: string
  name: string
  role: 'mae' | 'pai' | 'filho' | 'filha' | 'outro'
  user_id: string
  created_at: string
}

export interface ShoppingItem {
  id: string
  name: string
  quantity?: number
  unit?: string
  completed: boolean
  added_by: string
  family_id: string
  created_at: string
  member?: FamilyMember
}

export interface HouseTask {
  id: string
  title: string
  description?: string
  assigned_to?: string
  completed: boolean
  stars_earned: number
  family_id: string
  created_at: string
  completed_at?: string
  member?: FamilyMember
}

export interface FamilyEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  type: 'medico' | 'escola' | 'conta' | 'compromisso' | 'outro'
  reminder_set: boolean
  family_id: string
  created_by: string
  created_at: string
  member?: FamilyMember
}

export interface Meal {
  id: string
  name: string
  type: 'cafe' | 'almoco' | 'janta' | 'lanche'
  date: string
  ingredients?: string[]
  recipe?: string
  family_id: string
  created_at: string
}

export interface ChildRoutine {
  id: string
  child_name: string
  task: string
  time: string
  completed: boolean
  date: string
  family_id: string
  created_at: string
}

export interface HouseExpense {
  id: string
  title: string
  amount: number
  due_date: string
  paid: boolean
  category: 'conta' | 'mercado' | 'farmacia' | 'escola' | 'outro'
  family_id: string
  created_at: string
  paid_at?: string
}

export interface Family {
  id: string
  name: string
  created_by: string
  created_at: string
}