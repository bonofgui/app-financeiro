'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { 
  Family, 
  FamilyMember, 
  ShoppingItem, 
  HouseTask, 
  FamilyEvent, 
  Meal, 
  ChildRoutine, 
  HouseExpense 
} from '@/lib/types'
import AuthWrapper from '@/components/AuthWrapper'
import { 
  Plus, 
  ShoppingCart, 
  CheckSquare, 
  Calendar, 
  UtensilsCrossed, 
  Baby, 
  DollarSign, 
  LogOut, 
  Star,
  Clock,
  Users,
  Home,
  AlertCircle,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, isToday, isTomorrow, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Home() {
  return (
    <AuthWrapper>
      {(user) => <MaeNaLinhaApp user={user} />}
    </AuthWrapper>
  )
}

function MaeNaLinhaApp({ user }: { user: User }) {
  const [family, setFamily] = useState<Family | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [houseTasks, setHouseTasks] = useState<HouseTask[]>([])
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [childRoutines, setChildRoutines] = useState<ChildRoutine[]>([])
  const [houseExpenses, setHouseExpenses] = useState<HouseExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Estados dos modais
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddShopping, setShowAddShopping] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showAddRoutine, setShowAddRoutine] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)

  // Estados dos formulários
  const [newMember, setNewMember] = useState({ name: '', role: 'filho' as const })
  const [newShoppingItem, setNewShoppingItem] = useState({ name: '', quantity: 1, unit: '' })
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '' })
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', type: 'compromisso' as const })
  const [newMeal, setNewMeal] = useState({ name: '', type: 'almoco' as const, date: format(new Date(), 'yyyy-MM-dd'), recipe: '' })
  const [newRoutine, setNewRoutine] = useState({ child_name: '', task: '', time: '08:00', date: format(new Date(), 'yyyy-MM-dd') })
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', due_date: format(new Date(), 'yyyy-MM-dd'), category: 'conta' as const })

  useEffect(() => {
    initializeFamily()
  }, [user])

  const initializeFamily = async () => {
    try {
      // Verificar se usuário já tem família
      let { data: existingFamily } = await supabase
        .from('families')
        .select('*')
        .eq('created_by', user.id)
        .single()

      if (!existingFamily) {
        // Criar família padrão
        const { data: newFamily } = await supabase
          .from('families')
          .insert([{
            name: `Família ${user.email?.split('@')[0]}`,
            created_by: user.id
          }])
          .select()
          .single()

        if (newFamily) {
          existingFamily = newFamily
          
          // Criar membro principal (mãe)
          await supabase
            .from('family_members')
            .insert([{
              name: user.email?.split('@')[0] || 'Mãe',
              role: 'mae',
              user_id: user.id,
              family_id: newFamily.id
            }])
        }
      }

      setFamily(existingFamily)
      if (existingFamily) {
        await loadFamilyData(existingFamily.id)
      }
    } catch (error) {
      console.error('Erro ao inicializar família:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFamilyData = async (familyId: string) => {
    try {
      // Carregar membros da família
      const { data: members } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at')

      if (members) setFamilyMembers(members)

      // Carregar lista de compras
      const { data: shopping } = await supabase
        .from('shopping_items')
        .select(`
          *,
          member:family_members(*)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (shopping) setShoppingItems(shopping)

      // Carregar tarefas
      const { data: tasks } = await supabase
        .from('house_tasks')
        .select(`
          *,
          member:family_members(*)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (tasks) setHouseTasks(tasks)

      // Carregar eventos
      const { data: events } = await supabase
        .from('family_events')
        .select(`
          *,
          member:family_members(*)
        `)
        .eq('family_id', familyId)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date')

      if (events) setFamilyEvents(events)

      // Carregar refeições da semana
      const weekStart = new Date()
      const weekEnd = addDays(weekStart, 7)
      
      const { data: mealsData } = await supabase
        .from('meals')
        .select('*')
        .eq('family_id', familyId)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date')

      if (mealsData) setMeals(mealsData)

      // Carregar rotinas de hoje
      const { data: routines } = await supabase
        .from('child_routines')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .order('time')

      if (routines) setChildRoutines(routines)

      // Carregar despesas pendentes
      const { data: expenses } = await supabase
        .from('house_expenses')
        .select('*')
        .eq('family_id', familyId)
        .eq('paid', false)
        .order('due_date')

      if (expenses) setHouseExpenses(expenses)

    } catch (error) {
      console.error('Erro ao carregar dados da família:', error)
    }
  }

  const addMember = async () => {
    if (!newMember.name.trim() || !family) return

    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert([{
          name: newMember.name.trim(),
          role: newMember.role,
          user_id: user.id,
          family_id: family.id
        }])
        .select()

      if (error) throw error

      if (data) {
        setFamilyMembers(prev => [...prev, data[0]])
        setNewMember({ name: '', role: 'filho' })
        setShowAddMember(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
    }
  }

  const addShoppingItem = async () => {
    if (!newShoppingItem.name.trim() || !family) return

    const currentMember = familyMembers.find(m => m.user_id === user.id)
    if (!currentMember) return

    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([{
          name: newShoppingItem.name.trim(),
          quantity: newShoppingItem.quantity || 1,
          unit: newShoppingItem.unit || null,
          added_by: currentMember.id,
          family_id: family.id
        }])
        .select(`
          *,
          member:family_members(*)
        `)

      if (error) throw error

      if (data) {
        setShoppingItems(prev => [data[0], ...prev])
        setNewShoppingItem({ name: '', quantity: 1, unit: '' })
        setShowAddShopping(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error)
    }
  }

  const toggleShoppingItem = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ completed })
        .eq('id', id)

      if (error) throw error

      setShoppingItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, completed } : item
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
    }
  }

  const addTask = async () => {
    if (!newTask.title.trim() || !family) return

    try {
      const { data, error } = await supabase
        .from('house_tasks')
        .insert([{
          title: newTask.title.trim(),
          description: newTask.description || null,
          assigned_to: newTask.assigned_to || null,
          family_id: family.id
        }])
        .select(`
          *,
          member:family_members(*)
        `)

      if (error) throw error

      if (data) {
        setHouseTasks(prev => [data[0], ...prev])
        setNewTask({ title: '', description: '', assigned_to: '' })
        setShowAddTask(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error)
    }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const updateData: any = { completed }
      if (completed) {
        updateData.completed_at = new Date().toISOString()
        updateData.stars_earned = 1
      } else {
        updateData.completed_at = null
        updateData.stars_earned = 0
      }

      const { error } = await supabase
        .from('house_tasks')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      setHouseTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...updateData } : task
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const addEvent = async () => {
    if (!newEvent.title.trim() || !family) return

    const currentMember = familyMembers.find(m => m.user_id === user.id)
    if (!currentMember) return

    try {
      const { data, error } = await supabase
        .from('family_events')
        .insert([{
          title: newEvent.title.trim(),
          description: newEvent.description || null,
          date: newEvent.date,
          time: newEvent.time || null,
          type: newEvent.type,
          created_by: currentMember.id,
          family_id: family.id
        }])
        .select(`
          *,
          member:family_members(*)
        `)

      if (error) throw error

      if (data) {
        setFamilyEvents(prev => [...prev, data[0]].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        setNewEvent({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', type: 'compromisso' })
        setShowAddEvent(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar evento:', error)
    }
  }

  const addExpense = async () => {
    if (!newExpense.title.trim() || !newExpense.amount || !family) return

    try {
      const { data, error } = await supabase
        .from('house_expenses')
        .insert([{
          title: newExpense.title.trim(),
          amount: parseFloat(newExpense.amount),
          due_date: newExpense.due_date,
          category: newExpense.category,
          family_id: family.id
        }])
        .select()

      if (error) throw error

      if (data) {
        setHouseExpenses(prev => [...prev, data[0]].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()))
        setNewExpense({ title: '', amount: '', due_date: format(new Date(), 'yyyy-MM-dd'), category: 'conta' })
        setShowAddExpense(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error)
    }
  }

  const toggleExpense = async (id: string, paid: boolean) => {
    try {
      const updateData: any = { paid }
      if (paid) {
        updateData.paid_at = new Date().toISOString()
      } else {
        updateData.paid_at = null
      }

      const { error } = await supabase
        .from('house_expenses')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      setHouseExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? { ...expense, ...updateData } : expense
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'medico': return '🏥'
      case 'escola': return '🏫'
      case 'conta': return '💰'
      case 'compromisso': return '📅'
      default: return '📌'
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'medico': return 'text-red-400'
      case 'escola': return 'text-blue-400'
      case 'conta': return 'text-yellow-400'
      case 'compromisso': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-pink-900 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4\"></div>
          <p className=\"text-pink-100 text-lg\">Carregando...</p>
        </div>
      </div>
    )
  }

  const todayEvents = familyEvents.filter(event => isToday(new Date(event.date)))
  const tomorrowEvents = familyEvents.filter(event => isTomorrow(new Date(event.date)))
  const upcomingEvents = familyEvents.filter(event => {
    const eventDate = new Date(event.date)
    return !isToday(eventDate) && !isTomorrow(eventDate)
  }).slice(0, 3)

  const pendingTasks = houseTasks.filter(task => !task.completed)
  const completedTasks = houseTasks.filter(task => task.completed)
  const pendingShopping = shoppingItems.filter(item => !item.completed)
  const overdueBills = houseExpenses.filter(expense => !expense.paid && new Date(expense.due_date) < new Date())

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-pink-900\">
      {/* Header */}
      <header className=\"bg-rose-800/50 backdrop-blur-sm border-b border-pink-300/20 p-4\">
        <div className=\"max-w-7xl mx-auto flex items-center justify-between\">
          <div className=\"flex items-center gap-3\">
            <Home className=\"w-8 h-8 text-pink-300\" />
            <h1 className=\"text-2xl font-bold text-pink-300\">MÃE NA LINHA</h1>
          </div>
          
          <div className=\"flex items-center gap-4\">
            <span className=\"text-pink-100\">Olá, {familyMembers.find(m => m.user_id === user.id)?.name || 'Mãe'}!</span>
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={signOut}
              className=\"text-pink-100 hover:text-pink-300 hover:bg-rose-700/50\"
            >
              <LogOut className=\"w-4 h-4\" />
            </Button>
          </div>
        </div>
      </header>

      <div className=\"max-w-7xl mx-auto p-4\">
        <Tabs value={activeTab} onValueChange={setActiveTab} className=\"space-y-6\">
          <TabsList className=\"grid w-full grid-cols-7 bg-rose-800/30 border border-pink-300/20\">
            <TabsTrigger value=\"dashboard\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <Home className=\"w-4 h-4 mr-2\" />
              Início
            </TabsTrigger>
            <TabsTrigger value=\"shopping\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <ShoppingCart className=\"w-4 h-4 mr-2\" />
              Compras
            </TabsTrigger>
            <TabsTrigger value=\"tasks\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <CheckSquare className=\"w-4 h-4 mr-2\" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value=\"events\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <Calendar className=\"w-4 h-4 mr-2\" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value=\"meals\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <UtensilsCrossed className=\"w-4 h-4 mr-2\" />
              Refeições
            </TabsTrigger>
            <TabsTrigger value=\"routines\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <Baby className=\"w-4 h-4 mr-2\" />
              Rotina
            </TabsTrigger>
            <TabsTrigger value=\"expenses\" className=\"data-[state=active]:bg-pink-300 data-[state=active]:text-rose-900\">
              <DollarSign className=\"w-4 h-4 mr-2\" />
              Despesas
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value=\"dashboard\" className=\"space-y-6\">
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
              {/* Alertas importantes */}
              {overdueBills.length > 0 && (
                <Card className=\"bg-red-500/20 border-red-400/30 backdrop-blur-sm\">
                  <CardHeader className=\"pb-2\">
                    <CardTitle className=\"text-red-300 text-sm flex items-center gap-2\">
                      <AlertCircle className=\"w-4 h-4\" />
                      Contas Vencidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-red-300\">{overdueBills.length}</div>
                    <p className=\"text-red-200 text-sm\">Precisam ser pagas</p>
                  </CardContent>
                </Card>
              )}

              {/* Lista de compras */}
              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader className=\"pb-2\">
                  <CardTitle className=\"text-pink-300 text-sm flex items-center gap-2\">
                    <ShoppingCart className=\"w-4 h-4\" />
                    Lista de Compras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"text-2xl font-bold text-pink-300\">{pendingShopping.length}</div>
                  <p className=\"text-pink-200 text-sm\">Itens pendentes</p>
                </CardContent>
              </Card>

              {/* Tarefas pendentes */}
              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader className=\"pb-2\">
                  <CardTitle className=\"text-pink-300 text-sm flex items-center gap-2\">
                    <CheckSquare className=\"w-4 h-4\" />
                    Tarefas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"text-2xl font-bold text-pink-300\">{pendingTasks.length}</div>
                  <p className=\"text-pink-200 text-sm\">Pendentes</p>
                </CardContent>
              </Card>

              {/* Eventos hoje */}
              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader className=\"pb-2\">
                  <CardTitle className=\"text-pink-300 text-sm flex items-center gap-2\">
                    <Calendar className=\"w-4 h-4\" />
                    Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"text-2xl font-bold text-pink-300\">{todayEvents.length}</div>
                  <p className=\"text-pink-200 text-sm\">Compromissos</p>
                </CardContent>
              </Card>
            </div>

            {/* Resumo do dia */}
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader>
                  <CardTitle className=\"text-pink-300\">Hoje</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-4\">
                  {todayEvents.length > 0 ? (
                    todayEvents.map(event => (
                      <div key={event.id} className=\"flex items-center gap-3 p-2 rounded bg-rose-700/30\">
                        <span className=\"text-2xl\">{getEventTypeIcon(event.type)}</span>
                        <div className=\"flex-1\">
                          <p className=\"text-pink-100 font-medium\">{event.title}</p>
                          {event.time && <p className=\"text-pink-200 text-sm\">{event.time}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className=\"text-pink-200 text-center py-4\">Nenhum compromisso para hoje! 🎉</p>
                  )}
                </CardContent>
              </Card>

              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader>
                  <CardTitle className=\"text-pink-300\">Amanhã</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-4\">
                  {tomorrowEvents.length > 0 ? (
                    tomorrowEvents.map(event => (
                      <div key={event.id} className=\"flex items-center gap-3 p-2 rounded bg-rose-700/30\">
                        <span className=\"text-2xl\">{getEventTypeIcon(event.type)}</span>
                        <div className=\"flex-1\">
                          <p className=\"text-pink-100 font-medium\">{event.title}</p>
                          {event.time && <p className=\"text-pink-200 text-sm\">{event.time}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className=\"text-pink-200 text-center py-4\">Nada programado para amanhã</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lista de Compras */}
          <TabsContent value=\"shopping\" className=\"space-y-6\">
            <div className=\"flex justify-between items-center\">
              <h2 className=\"text-2xl font-bold text-pink-300\">Lista de Compras</h2>
              <Dialog open={showAddShopping} onOpenChange={setShowAddShopping}>
                <DialogTrigger asChild>
                  <Button className=\"bg-pink-500 hover:bg-pink-600 text-white\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Adicionar Item
                  </Button>
                </DialogTrigger>
                <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                  <DialogHeader>
                    <DialogTitle className=\"text-pink-300\">Novo Item</DialogTitle>
                  </DialogHeader>
                  <div className=\"space-y-4\">
                    <div>
                      <Label className=\"text-pink-100\">Nome do Item</Label>
                      <Input
                        value={newShoppingItem.name}
                        onChange={(e) => setNewShoppingItem(prev => ({ ...prev, name: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Ex: Leite, Pão, Arroz...\"
                      />
                    </div>
                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <Label className=\"text-pink-100\">Quantidade</Label>
                        <Input
                          type=\"number\"
                          value={newShoppingItem.quantity}
                          onChange={(e) => setNewShoppingItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Unidade</Label>
                        <Input
                          value={newShoppingItem.unit}
                          onChange={(e) => setNewShoppingItem(prev => ({ ...prev, unit: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                          placeholder=\"kg, L, unid...\"
                        />
                      </div>
                    </div>
                    <Button onClick={addShoppingItem} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                      Adicionar à Lista
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader>
                  <CardTitle className=\"text-pink-300\">Pendentes ({pendingShopping.length})</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-2 max-h-96 overflow-y-auto\">
                  {pendingShopping.map(item => (
                    <div key={item.id} className=\"flex items-center gap-3 p-3 rounded bg-rose-700/30\">
                      <Button
                        variant=\"ghost\"
                        size=\"sm\"
                        onClick={() => toggleShoppingItem(item.id, true)}
                        className=\"text-pink-300 hover:text-pink-100 p-1\"
                      >
                        <Check className=\"w-4 h-4\" />
                      </Button>
                      <div className=\"flex-1\">
                        <p className=\"text-pink-100 font-medium\">{item.name}</p>
                        <p className=\"text-pink-200 text-sm\">
                          {item.quantity} {item.unit} • Por {item.member?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                  {pendingShopping.length === 0 && (
                    <p className=\"text-pink-200 text-center py-8\">Lista vazia! Tudo comprado? 🛒✨</p>
                  )}
                </CardContent>
              </Card>

              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader>
                  <CardTitle className=\"text-pink-300\">Comprados</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-2 max-h-96 overflow-y-auto\">
                  {shoppingItems.filter(item => item.completed).map(item => (
                    <div key={item.id} className=\"flex items-center gap-3 p-3 rounded bg-green-500/20 border border-green-400/30\">
                      <Button
                        variant=\"ghost\"
                        size=\"sm\"
                        onClick={() => toggleShoppingItem(item.id, false)}
                        className=\"text-green-300 hover:text-green-100 p-1\"
                      >
                        <X className=\"w-4 h-4\" />
                      </Button>
                      <div className=\"flex-1\">
                        <p className=\"text-green-100 font-medium line-through\">{item.name}</p>
                        <p className=\"text-green-200 text-sm\">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tarefas da Casa */}
          <TabsContent value=\"tasks\" className=\"space-y-6\">
            <div className=\"flex justify-between items-center\">
              <h2 className=\"text-2xl font-bold text-pink-300\">Afazeres da Casa</h2>
              <div className=\"flex gap-2\">
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                  <DialogTrigger asChild>
                    <Button variant=\"outline\" className=\"border-pink-300/30 text-pink-100 hover:bg-pink-500/10\">
                      <Users className=\"w-4 h-4 mr-2\" />
                      Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                    <DialogHeader>
                      <DialogTitle className=\"text-pink-300\">Novo Membro da Família</DialogTitle>
                    </DialogHeader>
                    <div className=\"space-y-4\">
                      <div>
                        <Label className=\"text-pink-100\">Nome</Label>
                        <Input
                          value={newMember.name}
                          onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                          placeholder=\"Nome do membro\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Papel</Label>
                        <Select value={newMember.role} onValueChange={(value: any) => setNewMember(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=\"pai\">Pai</SelectItem>
                            <SelectItem value=\"filho\">Filho</SelectItem>
                            <SelectItem value=\"filha\">Filha</SelectItem>
                            <SelectItem value=\"outro\">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addMember} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                        Adicionar Membro
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                  <DialogTrigger asChild>
                    <Button className=\"bg-pink-500 hover:bg-pink-600 text-white\">
                      <Plus className=\"w-4 h-4 mr-2\" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                    <DialogHeader>
                      <DialogTitle className=\"text-pink-300\">Nova Tarefa</DialogTitle>
                    </DialogHeader>
                    <div className=\"space-y-4\">
                      <div>
                        <Label className=\"text-pink-100\">Título</Label>
                        <Input
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                          placeholder=\"Ex: Limpar banheiro, Varrer sala...\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Descrição</Label>
                        <Textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                          placeholder=\"Detalhes da tarefa...\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Atribuir para</Label>
                        <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask(prev => ({ ...prev, assigned_to: value }))}>
                          <SelectTrigger className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\">
                            <SelectValue placeholder=\"Selecione um membro\" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=\"\">Ninguém específico</SelectItem>
                            {familyMembers.map(member => (
                              <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addTask} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                        Criar Tarefa
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader>
                  <CardTitle className=\"text-pink-300\">Pendentes ({pendingTasks.length})</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-2 max-h-96 overflow-y-auto\">
                  {pendingTasks.map(task => (
                    <div key={task.id} className=\"flex items-center gap-3 p-3 rounded bg-rose-700/30\">
                      <Button
                        variant=\"ghost\"
                        size=\"sm\"
                        onClick={() => toggleTask(task.id, true)}
                        className=\"text-pink-300 hover:text-pink-100 p-1\"
                      >
                        <Check className=\"w-4 h-4\" />
                      </Button>
                      <div className=\"flex-1\">
                        <p className=\"text-pink-100 font-medium\">{task.title}</p>
                        <p className=\"text-pink-200 text-sm\">
                          {task.member ? `Atribuída para ${task.member.name}` : 'Sem responsável'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className=\"text-pink-200 text-center py-8\">Todas as tarefas concluídas! 🎉</p>
                  )}
                </CardContent>
              </Card>

              <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                <CardHeader>
                  <CardTitle className=\"text-pink-300\">Concluídas</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-2 max-h-96 overflow-y-auto\">
                  {completedTasks.map(task => (
                    <div key={task.id} className=\"flex items-center gap-3 p-3 rounded bg-green-500/20 border border-green-400/30\">
                      <div className=\"flex items-center gap-1\">
                        <Star className=\"w-4 h-4 text-yellow-400 fill-current\" />
                        <span className=\"text-yellow-400 text-sm\">{task.stars_earned}</span>
                      </div>
                      <div className=\"flex-1\">
                        <p className=\"text-green-100 font-medium\">{task.title}</p>
                        <p className=\"text-green-200 text-sm\">
                          {task.member?.name} • {task.completed_at && format(new Date(task.completed_at), 'dd/MM HH:mm')}
                        </p>
                      </div>
                      <Button
                        variant=\"ghost\"
                        size=\"sm\"
                        onClick={() => toggleTask(task.id, false)}
                        className=\"text-green-300 hover:text-green-100 p-1\"
                      >
                        <X className=\"w-4 h-4\" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agenda Familiar */}
          <TabsContent value=\"events\" className=\"space-y-6\">
            <div className=\"flex justify-between items-center\">
              <h2 className=\"text-2xl font-bold text-pink-300\">Agenda Familiar</h2>
              <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
                <DialogTrigger asChild>
                  <Button className=\"bg-pink-500 hover:bg-pink-600 text-white\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                  <DialogHeader>
                    <DialogTitle className=\"text-pink-300\">Novo Evento</DialogTitle>
                  </DialogHeader>
                  <div className=\"space-y-4\">
                    <div>
                      <Label className=\"text-pink-100\">Título</Label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Ex: Consulta médica, Reunião escola...\"
                      />
                    </div>
                    <div>
                      <Label className=\"text-pink-100\">Descrição</Label>
                      <Textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Detalhes do evento...\"
                      />
                    </div>
                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <Label className=\"text-pink-100\">Data</Label>
                        <Input
                          type=\"date\"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Horário</Label>
                        <Input
                          type=\"time\"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className=\"text-pink-100\">Tipo</Label>
                      <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=\"medico\">Médico</SelectItem>
                          <SelectItem value=\"escola\">Escola</SelectItem>
                          <SelectItem value=\"conta\">Conta a pagar</SelectItem>
                          <SelectItem value=\"compromisso\">Compromisso</SelectItem>
                          <SelectItem value=\"outro\">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addEvent} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                      Adicionar Evento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className=\"space-y-4\">
              {familyEvents.length > 0 ? (
                familyEvents.map(event => (
                  <Card key={event.id} className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                    <CardContent className=\"p-4\">
                      <div className=\"flex items-center gap-4\">
                        <div className=\"text-3xl\">{getEventTypeIcon(event.type)}</div>
                        <div className=\"flex-1\">
                          <h3 className=\"text-pink-100 font-semibold text-lg\">{event.title}</h3>
                          {event.description && (
                            <p className=\"text-pink-200 text-sm mb-2\">{event.description}</p>
                          )}
                          <div className=\"flex items-center gap-4 text-sm text-pink-300\">
                            <span>{format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            {event.time && <span>{event.time}</span>}
                            <span className={`px-2 py-1 rounded text-xs ${getEventTypeColor(event.type)} bg-current/10`}>
                              {event.type}
                            </span>
                          </div>
                        </div>
                        <div className=\"text-right\">
                          {isToday(new Date(event.date)) && (
                            <span className=\"bg-pink-500 text-white px-2 py-1 rounded text-xs font-medium\">
                              HOJE
                            </span>
                          )}
                          {isTomorrow(new Date(event.date)) && (
                            <span className=\"bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium\">
                              AMANHÃ
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                  <CardContent className=\"p-8 text-center\">
                    <p className=\"text-pink-200\">Nenhum evento programado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Planejamento de Refeições */}
          <TabsContent value=\"meals\" className=\"space-y-6\">
            <div className=\"flex justify-between items-center\">
              <h2 className=\"text-2xl font-bold text-pink-300\">Planejamento de Refeições</h2>
              <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
                <DialogTrigger asChild>
                  <Button className=\"bg-pink-500 hover:bg-pink-600 text-white\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Planejar Refeição
                  </Button>
                </DialogTrigger>
                <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                  <DialogHeader>
                    <DialogTitle className=\"text-pink-300\">Nova Refeição</DialogTitle>
                  </DialogHeader>
                  <div className=\"space-y-4\">
                    <div>
                      <Label className=\"text-pink-100\">Nome da Refeição</Label>
                      <Input
                        value={newMeal.name}
                        onChange={(e) => setNewMeal(prev => ({ ...prev, name: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Ex: Arroz com feijão, Macarronada...\"
                      />
                    </div>
                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <Label className=\"text-pink-100\">Tipo</Label>
                        <Select value={newMeal.type} onValueChange={(value: any) => setNewMeal(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=\"cafe\">Café da manhã</SelectItem>
                            <SelectItem value=\"almoco\">Almoço</SelectItem>
                            <SelectItem value=\"lanche\">Lanche</SelectItem>
                            <SelectItem value=\"janta\">Janta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Data</Label>
                        <Input
                          type=\"date\"
                          value={newMeal.date}
                          onChange={(e) => setNewMeal(prev => ({ ...prev, date: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className=\"text-pink-100\">Receita/Observações</Label>
                      <Textarea
                        value={newMeal.recipe}
                        onChange={(e) => setNewMeal(prev => ({ ...prev, recipe: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Ingredientes, modo de preparo...\"
                      />
                    </div>
                    <Button onClick={() => {
                      // Implementar addMeal
                      console.log('Add meal:', newMeal)
                    }} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                      Adicionar ao Cardápio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
              <CardHeader>
                <CardTitle className=\"text-pink-300\">Cardápio da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <p className=\"text-pink-200 text-center py-8\">
                  Funcionalidade em desenvolvimento...
                  <br />
                  Em breve você poderá planejar todas as refeições da semana!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rotina das Crianças */}
          <TabsContent value=\"routines\" className=\"space-y-6\">
            <div className=\"flex justify-between items-center\">
              <h2 className=\"text-2xl font-bold text-pink-300\">Rotina das Crianças</h2>
              <Dialog open={showAddRoutine} onOpenChange={setShowAddRoutine}>
                <DialogTrigger asChild>
                  <Button className=\"bg-pink-500 hover:bg-pink-600 text-white\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Nova Rotina
                  </Button>
                </DialogTrigger>
                <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                  <DialogHeader>
                    <DialogTitle className=\"text-pink-300\">Nova Rotina</DialogTitle>
                  </DialogHeader>
                  <div className=\"space-y-4\">
                    <div>
                      <Label className=\"text-pink-100\">Nome da Criança</Label>
                      <Input
                        value={newRoutine.child_name}
                        onChange={(e) => setNewRoutine(prev => ({ ...prev, child_name: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Nome da criança\"
                      />
                    </div>
                    <div>
                      <Label className=\"text-pink-100\">Tarefa</Label>
                      <Input
                        value={newRoutine.task}
                        onChange={(e) => setNewRoutine(prev => ({ ...prev, task: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Ex: Tomar banho, Fazer dever, Escovar dentes...\"
                      />
                    </div>
                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <Label className=\"text-pink-100\">Horário</Label>
                        <Input
                          type=\"time\"
                          value={newRoutine.time}
                          onChange={(e) => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Data</Label>
                        <Input
                          type=\"date\"
                          value={newRoutine.date}
                          onChange={(e) => setNewRoutine(prev => ({ ...prev, date: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                    </div>
                    <Button onClick={() => {
                      // Implementar addRoutine
                      console.log('Add routine:', newRoutine)
                    }} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                      Adicionar à Rotina
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
              <CardHeader>
                <CardTitle className=\"text-pink-300\">Rotina de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <p className=\"text-pink-200 text-center py-8\">
                  Funcionalidade em desenvolvimento...
                  <br />
                  Em breve você poderá gerenciar a rotina completa das crianças!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Despesas da Casa */}
          <TabsContent value=\"expenses\" className=\"space-y-6\">
            <div className=\"flex justify-between items-center\">
              <h2 className=\"text-2xl font-bold text-pink-300\">Despesas da Casa</h2>
              <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogTrigger asChild>
                  <Button className=\"bg-pink-500 hover:bg-pink-600 text-white\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent className=\"bg-rose-800 border-pink-300/30\">
                  <DialogHeader>
                    <DialogTitle className=\"text-pink-300\">Nova Despesa</DialogTitle>
                  </DialogHeader>
                  <div className=\"space-y-4\">
                    <div>
                      <Label className=\"text-pink-100\">Título</Label>
                      <Input
                        value={newExpense.title}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                        className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        placeholder=\"Ex: Conta de luz, Internet, Mercado...\"
                      />
                    </div>
                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <Label className=\"text-pink-100\">Valor</Label>
                        <Input
                          type=\"number\"
                          step=\"0.01\"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                          placeholder=\"0,00\"
                        />
                      </div>
                      <div>
                        <Label className=\"text-pink-100\">Vencimento</Label>
                        <Input
                          type=\"date\"
                          value={newExpense.due_date}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, due_date: e.target.value }))}
                          className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className=\"text-pink-100\">Categoria</Label>
                      <Select value={newExpense.category} onValueChange={(value: any) => setNewExpense(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className=\"bg-rose-700/50 border-pink-300/30 text-pink-100\">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=\"conta\">Conta</SelectItem>
                          <SelectItem value=\"mercado\">Mercado</SelectItem>
                          <SelectItem value=\"farmacia\">Farmácia</SelectItem>
                          <SelectItem value=\"escola\">Escola</SelectItem>
                          <SelectItem value=\"outro\">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addExpense} className=\"w-full bg-pink-500 hover:bg-pink-600 text-white\">
                      Adicionar Despesa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className=\"space-y-4\">
              {houseExpenses.length > 0 ? (
                houseExpenses.map(expense => (
                  <Card key={expense.id} className={`backdrop-blur-sm ${
                    expense.paid 
                      ? 'bg-green-500/20 border-green-400/30' 
                      : new Date(expense.due_date) < new Date()
                        ? 'bg-red-500/20 border-red-400/30'
                        : 'bg-rose-800/50 border-pink-300/20'
                  }`}>
                    <CardContent className=\"p-4\">
                      <div className=\"flex items-center justify-between\">
                        <div className=\"flex-1\">
                          <h3 className={`font-semibold text-lg ${
                            expense.paid ? 'text-green-100' : 'text-pink-100'
                          }`}>
                            {expense.title}
                          </h3>
                          <div className=\"flex items-center gap-4 text-sm mt-1\">
                            <span className={expense.paid ? 'text-green-200' : 'text-pink-200'}>
                              {formatCurrency(expense.amount)}
                            </span>
                            <span className={expense.paid ? 'text-green-300' : 'text-pink-300'}>
                              Vence: {format(new Date(expense.due_date), 'dd/MM/yyyy')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              expense.paid ? 'bg-green-400/20 text-green-300' : 'bg-pink-400/20 text-pink-300'
                            }`}>
                              {expense.category}
                            </span>
                          </div>
                          {new Date(expense.due_date) < new Date() && !expense.paid && (
                            <span className=\"text-red-300 text-sm font-medium\">⚠️ VENCIDA</span>
                          )}
                        </div>
                        <Button
                          onClick={() => toggleExpense(expense.id, !expense.paid)}
                          className={`${
                            expense.paid 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-pink-500 hover:bg-pink-600'
                          } text-white`}
                        >
                          {expense.paid ? 'Pago ✓' : 'Marcar como Pago'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className=\"bg-rose-800/50 border-pink-300/20 backdrop-blur-sm\">
                  <CardContent className=\"p-8 text-center\">
                    <p className=\"text-pink-200\">Nenhuma despesa cadastrada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}