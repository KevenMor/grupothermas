'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Smartphone, 
  QrCode, 
  Settings, 
  Bot, 
  MessageSquare, 
  Users, 
  Activity,
  RefreshCw,
  Power,
  PowerOff,
  Zap,
  Brain,
  Workflow
} from 'lucide-react'
import io from 'socket.io-client'

interface WhatsAppSession {
  id: string
  name: string
  phone: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  qrCode?: string
  lastActivity?: Date
  messagesCount: number
  aiEnabled: boolean
  n8nWebhook?: string
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [socket, setSocket] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null)

  useEffect(() => {
    // Conectar ao Socket.IO para receber atualizações em tempo real
    const socketConnection = io()
    setSocket(socketConnection)

    // Carregar sessões existentes
    loadSessions()

    // Escutar eventos do socket
    socketConnection.on('qr-code', (data: { sessionId: string, qr: string }) => {
      setSessions(prev => prev.map(session => 
        session.id === data.sessionId 
          ? { ...session, qrCode: data.qr, status: 'connecting' }
          : session
      ))
    })

    socketConnection.on('session-status', (data: { sessionId: string, status: string }) => {
      setSessions(prev => prev.map(session => 
        session.id === data.sessionId 
          ? { ...session, status: data.status as any, qrCode: data.status === 'connected' ? undefined : session.qrCode }
          : session
      ))
    })

    return () => {
      socketConnection.disconnect()
    }
  }, [])

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/whatsapp/sessions')
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
    }
  }

  const createSession = async () => {
    if (!newSessionName.trim()) return

    setIsCreatingSession(true)
    try {
      const response = await fetch('/api/whatsapp/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName })
      })

      if (response.ok) {
        const newSession = await response.json()
        setSessions(prev => [...prev, newSession])
        setNewSessionName('')
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const toggleSession = async (sessionId: string, action: 'start' | 'stop') => {
    try {
      await fetch(`/api/whatsapp/sessions/${sessionId}/${action}`, {
        method: 'POST'
      })
      loadSessions()
    } catch (error) {
      console.error(`Erro ao ${action} sessão:`, error)
    }
  }

  const updateAISettings = async (sessionId: string, aiEnabled: boolean, n8nWebhook?: string) => {
    try {
      await fetch(`/api/whatsapp/sessions/${sessionId}/ai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiEnabled, n8nWebhook })
      })
      loadSessions()
    } catch (error) {
      console.error('Erro ao atualizar configurações de IA:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'connecting': return 'Conectando'
      case 'error': return 'Erro'
      default: return 'Desconectado'
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              WhatsApp Business
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas conexões WhatsApp e automações com IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sessions">
              <Smartphone className="h-4 w-4 mr-2" />
              Sessões
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Bot className="h-4 w-4 mr-2" />
              Automação
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Activity className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            {/* Nova Sessão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Nova Conexão WhatsApp
                </CardTitle>
                <CardDescription>
                  Conecte um novo número WhatsApp ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="session-name">Nome da Sessão</Label>
                    <Input
                      id="session-name"
                      placeholder="Ex: Atendimento Principal"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={createSession}
                      disabled={isCreatingSession || !newSessionName.trim()}
                    >
                      {isCreatingSession ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      Criar Sessão
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Sessões */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Card key={session.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <Badge className={`${getStatusColor(session.status)} text-white`}>
                        {getStatusText(session.status)}
                      </Badge>
                    </div>
                    {session.phone && (
                      <CardDescription>{session.phone}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* QR Code */}
                    {session.qrCode && session.status === 'connecting' && (
                      <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-48 h-48 bg-white p-2 rounded-lg mb-2">
                          <img 
                            src={session.qrCode} 
                            alt="QR Code" 
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                          Escaneie com seu WhatsApp
                        </p>
                      </div>
                    )}

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-2xl font-bold text-thermas-blue-600">
                          {session.messagesCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Mensagens
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {session.aiEnabled ? 'ON' : 'OFF'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          IA
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      {session.status === 'connected' ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => toggleSession(session.id, 'stop')}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => toggleSession(session.id, 'start')}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Configurações de IA
                </CardTitle>
                <CardDescription>
                  Configure o agente IA e integrações com N8N
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Agente IA</h3>
                    <div className="space-y-2">
                      <Label>Modelo de IA</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>GPT-4</option>
                        <option>GPT-3.5 Turbo</option>
                        <option>Claude</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prompt do Sistema</Label>
                      <textarea 
                        className="w-full p-2 border rounded-md h-24"
                        placeholder="Você é um assistente virtual do Grupo Thermas..."
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Integração N8N</h3>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input placeholder="https://n8n.seudominio.com/webhook/whatsapp" />
                    </div>
                    <div className="space-y-2">
                      <Label>Eventos para N8N</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked />
                          <span>Nova mensagem recebida</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked />
                          <span>Resposta da IA enviada</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span>Transferência para humano</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mensagens Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-thermas-blue-600">1,234</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    +12% em relação a ontem
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Respostas IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">89%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Taxa de resolução automática
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Contatos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-thermas-orange-600">456</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conversas este mês
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
} 