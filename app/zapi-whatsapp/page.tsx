export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Bot, 
  Zap, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  QrCode,
  Users,
  TrendingUp,
  Clock,
  Send,
  Eye,
  BarChart3,
  Workflow,
  Smartphone,
  Globe,
  Shield,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ZAPIInstance {
  id: string
  name: string
  phone: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  token: string
  instanceId: string
  qrCode?: string
  lastActivity?: Date
  messagesCount: number
  n8nWebhook?: string
  aiEnabled: boolean
}

interface Message {
  id: string
  instanceId: string
  from: string
  to: string
  message: string
  type: 'text' | 'image' | 'document' | 'audio'
  timestamp: Date
  fromMe: boolean
  status: 'sent' | 'delivered' | 'read'
}

export default function ZAPIWhatsAppPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [instances, setInstances] = useState<ZAPIInstance[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newInstance, setNewInstance] = useState({
    name: '',
    token: '',
    instanceId: '',
    n8nWebhook: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Mock data para demonstração
  useEffect(() => {
    // Simular dados existentes
    setInstances([
      {
        id: '1',
        name: 'Atendimento Principal',
        phone: '+55 11 99999-9999',
        status: 'connected',
        token: 'z-api-token-123',
        instanceId: 'instance-123',
        messagesCount: 245,
        n8nWebhook: 'https://n8n.exemplo.com/webhook/whatsapp',
        aiEnabled: true,
        lastActivity: new Date()
      },
      {
        id: '2',
        name: 'Vendas Thermas',
        phone: '+55 11 88888-8888',
        status: 'disconnected',
        token: 'z-api-token-456',
        instanceId: 'instance-456',
        messagesCount: 89,
        aiEnabled: false
      }
    ])

    setMessages([
      {
        id: '1',
        instanceId: 'instance-123',
        from: '+5511999999999',
        to: '+5511888888888',
        message: 'Olá! Gostaria de informações sobre os pacotes de viagem.',
        type: 'text',
        timestamp: new Date(Date.now() - 300000),
        fromMe: false,
        status: 'read'
      },
      {
        id: '2',
        instanceId: 'instance-123',
        from: '+5511888888888',
        to: '+5511999999999',
        message: 'Olá! Claro, temos pacotes incríveis para Caldas Novas. Qual é o seu interesse?',
        type: 'text',
        timestamp: new Date(Date.now() - 240000),
        fromMe: true,
        status: 'delivered'
      }
    ])
  }, [])

  const handleCreateInstance = async () => {
    setIsLoading(true)
    try {
      // Simular criação de instância Z-API
      const instance: ZAPIInstance = {
        id: Date.now().toString(),
        name: newInstance.name,
        phone: '',
        status: 'connecting',
        token: newInstance.token,
        instanceId: newInstance.instanceId,
        messagesCount: 0,
        n8nWebhook: newInstance.n8nWebhook,
        aiEnabled: false
      }
      
      setInstances(prev => [...prev, instance])
      setNewInstance({ name: '', token: '', instanceId: '', n8nWebhook: '' })
      
      // Simular geração de QR code
      setTimeout(() => {
        setInstances(prev => prev.map(inst => 
          inst.id === instance.id 
            ? { ...inst, qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }
            : inst
        ))
      }, 2000)
    } catch (error) {
      console.error('Erro ao criar instância:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectInstance = async (instanceId: string) => {
    setInstances(prev => prev.map(inst => 
      inst.id === instanceId 
        ? { ...inst, status: 'connecting' }
        : inst
    ))

    // Simular conexão
    setTimeout(() => {
      setInstances(prev => prev.map(inst => 
        inst.id === instanceId 
          ? { 
              ...inst, 
              status: 'connected', 
              phone: '+55 11 99999-' + Math.floor(Math.random() * 9999),
              lastActivity: new Date(),
              qrCode: undefined
            }
          : inst
      ))
    }, 3000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 border-green-200 bg-green-50'
      case 'connecting': return 'text-yellow-600 border-yellow-200 bg-yellow-50'
      case 'disconnected': return 'text-red-600 border-red-200 bg-red-50'
      default: return 'text-gray-600 border-gray-200 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'connecting': return 'Conectando'
      case 'disconnected': return 'Desconectado'
      default: return 'Erro'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-12 w-12 text-green-600" />
              <Zap className="h-8 w-8 text-blue-600" />
              <Bot className="h-10 w-10 text-purple-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Z-API + N8N Integration
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            WhatsApp Business automatizado com fluxos inteligentes e IA integrada
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-green-100 text-green-700">✅ Z-API Oficial</Badge>
            <Badge className="bg-blue-100 text-blue-700">🔄 N8N Workflows</Badge>
            <Badge className="bg-purple-100 text-purple-700">🤖 IA Integrada</Badge>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="instances">Instâncias</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="workflows">N8N Flows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <MessageCircle className="h-5 w-5" />
                      Instâncias Ativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {instances.filter(i => i.status === 'connected').length}
                    </div>
                    <p className="text-sm text-gray-600">de {instances.length} total</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Send className="h-5 w-5" />
                      Mensagens Hoje
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {instances.reduce((sum, inst) => sum + inst.messagesCount, 0)}
                    </div>
                    <p className="text-sm text-gray-600">↗️ +23% vs ontem</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <Workflow className="h-5 w-5" />
                      Fluxos N8N
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">12</div>
                    <p className="text-sm text-gray-600">automações ativas</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <TrendingUp className="h-5 w-5" />
                      Taxa Resposta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">94%</div>
                    <p className="text-sm text-gray-600">média 24h</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col gap-2 bg-green-600 hover:bg-green-700">
                    <Smartphone className="h-6 w-6" />
                    Nova Instância Z-API
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Workflow className="h-6 w-6" />
                    Criar Fluxo N8N
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Ver Relatórios
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.slice(0, 5).map((message) => (
                    <div key={message.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${message.fromMe ? 'bg-blue-500' : 'bg-green-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.fromMe ? 'Você' : message.from.replace(/^\+55/, '')}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{message.message}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instances Tab */}
          <TabsContent value="instances" className="space-y-6">
            {/* Create New Instance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Nova Instância Z-API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome da Instância</label>
                    <Input 
                      placeholder="Ex: Atendimento Principal"
                      value={newInstance.name}
                      onChange={(e) => setNewInstance(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Token Z-API</label>
                    <Input 
                      placeholder="Seu token Z-API"
                      type="password"
                      value={newInstance.token}
                      onChange={(e) => setNewInstance(prev => ({ ...prev, token: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Instance ID</label>
                    <Input 
                      placeholder="ID da instância"
                      value={newInstance.instanceId}
                      onChange={(e) => setNewInstance(prev => ({ ...prev, instanceId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Webhook N8N (Opcional)</label>
                    <Input 
                      placeholder="https://n8n.exemplo.com/webhook/..."
                      value={newInstance.n8nWebhook}
                      onChange={(e) => setNewInstance(prev => ({ ...prev, n8nWebhook: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateInstance}
                  disabled={!newInstance.name || !newInstance.token || !newInstance.instanceId || isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Criando Instância...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Criar Instância
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Instances */}
            <div className="grid gap-6">
              {instances.map((instance) => (
                <motion.div
                  key={instance.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-green-600" />
                            <div>
                              <h3 className="font-semibold text-lg">{instance.name}</h3>
                              <p className="text-sm text-gray-600">{instance.phone || 'Aguardando conexão'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(instance.status)}>
                            {getStatusText(instance.status)}
                          </Badge>
                          {instance.aiEnabled && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Bot className="h-3 w-3 mr-1" />
                              IA Ativa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{instance.messagesCount}</div>
                          <div className="text-sm text-gray-600">Mensagens</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {instance.lastActivity ? 'Online' : 'Offline'}
                          </div>
                          <div className="text-sm text-gray-600">Status</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {instance.n8nWebhook ? 'Sim' : 'Não'}
                          </div>
                          <div className="text-sm text-gray-600">N8N</div>
                        </div>
                      </div>

                      {instance.qrCode && (
                        <div className="text-center mb-4">
                          <div className="inline-block p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <QrCode className="h-32 w-32 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Escaneie o QR Code com seu WhatsApp</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {instance.status === 'disconnected' && (
                          <Button 
                            onClick={() => handleConnectInstance(instance.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Conectar
                          </Button>
                        )}
                        {instance.status === 'connected' && (
                          <Button variant="outline">
                            <Pause className="h-4 w-4 mr-2" />
                            Desconectar
                          </Button>
                        )}
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Monitorar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Mensagens Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.fromMe 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <div className="text-sm font-medium mb-1">
                          {message.fromMe ? 'Você' : message.from.replace(/^\+55/, '')}
                        </div>
                        <div className="text-sm">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.fromMe ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* N8N Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Fluxos N8N Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    { name: 'Atendimento Inicial', status: 'Ativo', executions: 45 },
                    { name: 'Qualificação de Leads', status: 'Ativo', executions: 23 },
                    { name: 'Follow-up Vendas', status: 'Pausado', executions: 12 },
                    { name: 'Suporte Técnico', status: 'Ativo', executions: 8 }
                  ].map((workflow, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Workflow className="h-5 w-5 text-purple-600" />
                        <div>
                          <h4 className="font-medium">{workflow.name}</h4>
                          <p className="text-sm text-gray-600">{workflow.executions} execuções hoje</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={workflow.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {workflow.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Mensagens por Hora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    📊 Gráfico de mensagens por hora
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    📈 Gráfico de conversão
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 