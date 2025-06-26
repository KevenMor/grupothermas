'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  Target,
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Database,
  Loader2
} from 'lucide-react'
import { testFirebaseConnection, createTestData, getUserLeads, getUserContracts } from '@/lib/firebaseTest'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [loading, setLoading] = useState(false)
  const [firebaseConnected, setFirebaseConnected] = useState(false)
  const [realData, setRealData] = useState({
    leads: [] as any[],
    contracts: [] as any[],
    stats: {
      totalLeads: 0,
      totalContracts: 0,
      signedContracts: 0,
      pendingContracts: 0
    }
  })

  // Testar conexão Firebase ao carregar
  useEffect(() => {
    if (user) {
      checkFirebaseConnection()
      loadRealData()
    }
  }, [user])

  const checkFirebaseConnection = async () => {
    try {
      const connected = await testFirebaseConnection()
      setFirebaseConnected(connected)
      if (connected) {
        toast.success('Firebase conectado com sucesso!')
      } else {
        toast.error('Erro na conexão Firebase')
      }
    } catch (error) {
      console.error('Erro ao testar Firebase:', error)
      setFirebaseConnected(false)
    }
  }

  const loadRealData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [leads, contracts] = await Promise.all([
        getUserLeads(user.uid),
        getUserContracts(user.uid)
      ])

      const stats = {
        totalLeads: leads.length,
        totalContracts: contracts.length,
        signedContracts: contracts.filter((c: any) => c.status === 'signed').length,
        pendingContracts: contracts.filter((c: any) => c.status === 'pending').length
      }

      setRealData({ leads, contracts, stats })
      toast.success('Dados carregados do Firebase!')
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do Firebase')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestData = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      setLoading(true)
      toast.loading('Criando dados de teste...')
      
      // Criar dados de leads/contratos
      const success = await createTestData(user.uid)
      
      // Criar dados de chat para o Kanban
      const { createMockChatData } = await import('@/lib/mockChatData')
      const chatSuccess = await createMockChatData(user.uid)
      
      if (success && chatSuccess) {
        toast.success('Dados de teste criados! (Leads + Chats)')
        await loadRealData() // Recarregar dados
      } else {
        toast.error('Erro ao criar alguns dados de teste')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao criar dados de teste')
    } finally {
      setLoading(false)
    }
  }

  // Stats baseados em dados reais ou simulados
  const stats = [
    {
      name: 'Leads Ativos',
      value: realData.stats.totalLeads.toString(),
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'total de leads'
    },
    {
      name: 'Contratos Totais',
      value: realData.stats.totalContracts.toString(),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: FileText,
      description: 'contratos criados'
    },
    {
      name: 'Contratos Assinados',
      value: realData.stats.signedContracts.toString(),
      change: '+15.3%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      description: 'finalizados'
    },
    {
      name: 'Pendentes',
      value: realData.stats.pendingContracts.toString(),
      change: '-4.1%',
      changeType: 'negative' as const,
      icon: Clock,
      description: 'aguardando assinatura'
    }
  ]

  const recentActivity = realData.leads.slice(0, 4).map((lead, index) => ({
    id: index + 1,
    type: 'lead',
    title: 'Novo lead registrado',
    description: `${lead.name} - ${lead.interest}`,
    time: 'Recente',
    status: lead.status === 'new' ? 'new' : lead.status === 'qualified' ? 'success' : 'pending'
  }))

  const contractStatus = [
    { name: 'Assinados', value: Math.round((realData.stats.signedContracts / Math.max(realData.stats.totalContracts, 1)) * 100), color: 'bg-green-500' },
    { name: 'Pendentes', value: Math.round((realData.stats.pendingContracts / Math.max(realData.stats.totalContracts, 1)) * 100), color: 'bg-yellow-500' },
    { name: 'Em Análise', value: 20, color: 'bg-thermas-blue-500' },
    { name: 'Cancelados', value: 10, color: 'bg-red-500' }
  ]

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6 bg-gray-50/30 dark:bg-gray-900/30">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-gray-100"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2"
            >
              Acompanhe suas vendas e leads em tempo real
              <Badge variant={firebaseConnected ? "default" : "destructive"} className="text-xs">
                {firebaseConnected ? "Firebase OK" : "Firebase Erro"}
              </Badge>
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3"
          >
            <Button 
              variant="outline" 
              onClick={handleCreateTestData}
              disabled={loading || !firebaseConnected}
              className="text-gray-600 dark:text-gray-400"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Criar Dados Teste
            </Button>
            <Button className="bg-gradient-to-r from-thermas-blue-500 to-thermas-orange-500 hover:from-thermas-blue-600 hover:to-thermas-orange-600 text-white shadow-lg">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-lift bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <stat.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-gray-100">Vendas e Leads</CardTitle>
                      <CardDescription>Desempenho dos últimos 30 dias</CardDescription>
                    </div>
                    <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <TabsList className="bg-gray-100 dark:bg-gray-700">
                        <TabsTrigger value="7d" className="text-xs">7d</TabsTrigger>
                        <TabsTrigger value="30d" className="text-xs">30d</TabsTrigger>
                        <TabsTrigger value="90d" className="text-xs">90d</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Gráfico será implementado em breve
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {realData.stats.totalLeads} leads • {realData.stats.totalContracts} contratos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contract Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Status dos Contratos</CardTitle>
                  <CardDescription>Distribuição atual dos contratos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contractStatus.map((status, index) => (
                      <div key={status.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {status.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${status.color} transition-all duration-500`}
                              style={{ width: `${status.value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">
                            {status.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Atividade Recente</CardTitle>
                <CardDescription>
                  {realData.leads.length > 0 ? 'Dados reais do Firebase' : 'Últimas ações no sistema'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`flex items-start space-x-4 p-4 ${
                        index !== recentActivity.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                      } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                    >
                      <div className="flex-shrink-0">
                        {activity.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {activity.status === 'new' && (
                          <Activity className="h-5 w-5 text-thermas-blue-500" />
                        )}
                        {activity.status === 'pending' && (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum dado encontrado
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Clique em "Criar Dados Teste" para começar
                      </p>
                    </div>
                  )}
                </div>
                {recentActivity.length > 0 && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="ghost" size="sm" className="w-full text-gray-600 dark:text-gray-400 hover:text-thermas-blue-600">
                      Ver todas as atividades
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
} 