'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Bot, 
  Key, 
  Webhook, 
  QrCode, 
  Save, 
  TestTube,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Send,
  Wifi,
  XCircle,
  Loader,
  Clock,
  Zap,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiBaseUrl: string
  zapiClientToken: string
  openaiApiKey: string
  openaiModel: string
  openaiTemperature: number
  openaiMaxTokens: number
  systemPrompt: string
  welcomeMessage: string
  fallbackMessage: string
  handoffMessage: string
  webhookUrls: {
    leadCapture: string
    appointmentBooking: string
    paymentProcess: string
    supportTicket: string
    humanHandoff: string
  }
  qrCodeUrl: string
  connectionStatus: string
  lastConnection: string
  lastStatusCheck?: string
  createdAt: string
  updatedAt: string
  // Novo campo para delay humanizado
  responseDelayMin: number
  responseDelayMax: number
}

const defaultConfig: AdminConfig = {
  zapiApiKey: '',
  zapiInstanceId: '',
  zapiBaseUrl: 'https://api.z-api.io',
  zapiClientToken: '',
  openaiApiKey: '',
  openaiModel: 'gpt-4',
  openaiTemperature: 0.7,
  openaiMaxTokens: 1000,
  systemPrompt: `Você é um assistente virtual especializado do Grupo Thermas, uma empresa de turismo e hospedagem de luxo.

CONTEXTO:
- Somos especialistas em pacotes para águas termais, spas e resorts
- Oferecemos experiências premium de relaxamento e bem-estar
- Nosso foco é atendimento personalizado e experiências únicas

PERSONALIDADE:
- Seja caloroso, acolhedor e profissional
- Use linguagem elegante mas acessível
- Demonstre conhecimento sobre turismo termal
- Seja proativo em oferecer soluções

OBJETIVOS:
1. Qualificar leads interessados em pacotes
2. Agendar consultorias personalizadas
3. Fornecer informações sobre destinos e preços
4. Direcionar para atendimento humano quando necessário

INSTRUÇÕES:
- Sempre pergunte o nome do cliente
- Identifique o interesse específico (destino, data, número de pessoas)
- Ofereça opções adequadas ao perfil
- Colete dados de contato para follow-up
- Use contexto das conversas anteriores`,
  welcomeMessage: '🌿 Olá! Sou o assistente virtual do Grupo Thermas. Como posso ajudá-lo a encontrar a experiência termal perfeita para você?',
  fallbackMessage: 'Desculpe, não entendi completamente. Poderia reformular sua pergunta? Estou aqui para ajudar com informações sobre nossos pacotes termais e resorts.',
  handoffMessage: 'Vou conectar você com um de nossos especialistas para um atendimento mais personalizado. Um momento, por favor...',
  webhookUrls: {
    leadCapture: '',
    appointmentBooking: '',
    paymentProcess: '',
    supportTicket: '',
    humanHandoff: ''
  },
  qrCodeUrl: '',
  connectionStatus: 'checking',
  lastConnection: '',
  lastStatusCheck: '',
  createdAt: '',
  updatedAt: '',
  // Valores padrão para delay humanizado
  responseDelayMin: 2,
  responseDelayMax: 5
}

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [showApiKeys, setShowApiKeys] = useState({
    zapi: false,
    openai: false,
    zapiClientToken: false,
  })
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [lastStatusCheck, setLastStatusCheck] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false)

  const [status, setStatus] = useState<{
    openaiConnected: boolean
    zapiConnected: boolean
    qrCode: string
  }>({
    openaiConnected: false,
    zapiConnected: false,
    qrCode: ''
  })

  // Estados para simulação
  const [simulationMode, setSimulationMode] = useState(false)
  const [testMessage, setTestMessage] = useState('Esta é uma mensagem de teste.')
  const [testConversation, setTestConversation] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>([])
  const [isTestingAI, setIsTestingAI] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config')
      if (response.ok) {
        const data = await response.json()
        setConfig({ ...defaultConfig, ...data })
        setConnectionStatus(data.connectionStatus || 'disconnected')
        setLastStatusCheck(data.lastStatusCheck || null)
      } else {
        try {
          const errorData = await response.json()
          toast.error(errorData.error || 'Falha ao carregar configurações.')
        } catch {
          toast.error('Falha ao carregar configurações.')
        }
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error("Fetch config error:", error)
      toast.error('Erro de rede ao buscar configurações.')
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: value }))
  }

  const handleWebhookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      webhookUrls: {
        ...prev.webhookUrls,
        [name]: value
      }
    }))
  }

  const saveConfig = async () => {
    const promise = async () => {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro desconhecido')
      }

      return await response.json()
    }

    toast.promise(promise(), {
      loading: 'Salvando configurações...',
      success: async (data) => {
        await fetchConfig()
        return data.message || 'Configurações salvas com sucesso!'
      },
      error: (err) => `Erro ao salvar: ${err.message}`,
    })
  }

  const checkStatus = async () => {
    const toastId = toast.loading('Verificando status da conexão...')
    try {
      const response = await fetch('/api/admin/status')
      const data = await response.json()

      if (response.ok) {
        toast.success('Status verificado com sucesso!', { id: toastId })
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        setLastStatusCheck(new Date().toISOString())
        setConfig(prev => ({
          ...prev,
          connectionStatus: data.connected ? 'connected' : 'disconnected',
          lastStatusCheck: new Date().toISOString()
        }))
      } else {
        toast.error(data.error || 'Falha ao verificar status.', { id: toastId })
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error("Check status error:", error)
      toast.error('Erro de rede ao verificar status.', { id: toastId })
      setConnectionStatus('error')
    }
  }

  const generateQRCode = async () => {
    setGeneratingQR(true)
    const toastId = toast.loading('Gerando QR Code...')
    try {
      const response = await fetch('/api/admin/qr-code', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setQrCodeImage(data.qrCode)
        toast.success('QR Code gerado com sucesso!', { id: toastId })
      } else {
        toast.error(data.error || 'Falha ao gerar QR Code.', { id: toastId })
      }
    } catch (error) {
      console.error("Generate QR Code error:", error)
      toast.error('Erro de rede ao gerar QR Code.', { id: toastId })
    } finally {
      setGeneratingQR(false)
    }
  }

  const testConnection = async () => {
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      toast.error('Configure as credenciais Z-API primeiro')
      return
    }

    try {
      setTesting(true)
      const response = await fetch('/api/admin/test-zapi')
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Conexão Z-API testada com sucesso!')
      } else {
        toast.error(`Erro no teste: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Número de telefone e mensagem são obrigatórios')
      return
    }
    try {
      setSendingTest(true)
      const response = await fetch('/api/admin/test-zapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao enviar mensagem de teste')
      }
      toast.success('Mensagem de teste enviada com sucesso!')
    } catch (error: any) {
      toast.error(`Falha ao enviar: ${error.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (typeof window !== 'undefined' && navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        toast.success(`${label} copiado!`)
      } else {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast.success(`${label} copiado!`)
      }
    } catch (error) {
      console.error('Erro ao copiar:', error)
      toast.error('Erro ao copiar')
    }
  }

  const translateStatus = (status: string | null): string => {
    if (!status) return 'Indefinido'
    const translations: { [key: string]: string } = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      checking: 'Verificando...',
      error: 'Erro',
      connecting: 'Conectando...'
    }
    return translations[status] || 'Indefinido'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'connecting': return <Loader className="h-4 w-4 animate-spin" />
      case 'disconnected': return <XCircle className="h-4 w-4" />
      default: return <XCircle className="h-4 w-4" />
    }
  }

  const configureWebhook = async () => {
    setIsConfiguringWebhook(true)
    try {
      const response = await fetch('/api/admin/webhook-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Webhook configurado com sucesso!')
      } else {
        toast.error(`Erro ao configurar webhook: ${data.error}`)
      }
    } catch (error) {
      toast.error('Erro ao configurar webhook')
    } finally {
      setIsConfiguringWebhook(false)
    }
  }

  // Função para testar IA
  const testAIResponse = async () => {
    if (!testMessage.trim()) return
    
    setIsTestingAI(true)
    
    // Adicionar mensagem do usuário
    const userMessage = {
      role: 'user' as const,
      content: testMessage,
      timestamp: new Date().toISOString()
    }
    
    setTestConversation(prev => [...prev, userMessage])
    setTestMessage('')

    try {
      const response = await fetch('/api/admin/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: '5515999999999', // Número fictício para teste
          message: testMessage
        })
      })

      const result = await response.json()

      if (response.ok && result.aiResponse) {
        // Adicionar resposta da IA
        const aiMessage = {
          role: 'assistant' as const,
          content: result.aiResponse,
          timestamp: new Date().toISOString()
        }
        
        setTestConversation(prev => [...prev, aiMessage])
      } else {
        // Adicionar erro como resposta
        const errorMessage = {
          role: 'assistant' as const,
          content: `❌ Erro: ${result.error || 'Erro desconhecido'}`,
          timestamp: new Date().toISOString()
        }
        
        setTestConversation(prev => [...prev, errorMessage])
      }
    } catch (error: any) {
      console.error('Erro ao testar IA:', error)
      const errorMessage = {
        role: 'assistant' as const,
        content: `❌ Erro de conectividade: ${error.message}`,
        timestamp: new Date().toISOString()
      }
      
      setTestConversation(prev => [...prev, errorMessage])
    }

    setIsTestingAI(false)
  }

  // Limpar conversa de teste
  const clearTestConversation = () => {
    setTestConversation([])
    setTestMessage('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <AppLayout>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Painel Administrativo - IA Thermas
          </h1>
          <p className="text-gray-600 mt-2">
            Configure e gerencie o assistente virtual integrado com Z-API
          </p>
        </div>

        <Tabs defaultValue="zapi" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="zapi" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Z-API
            </TabsTrigger>
            <TabsTrigger value="openai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              OpenAI
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Conexão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zapi">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Configuração Z-API
                </CardTitle>
                <CardDescription>
                  Configure suas credenciais Z-API para integração WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zapiApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="zapiApiKey"
                        name="zapiApiKey"
                        type={showApiKeys.zapi ? "text" : "password"}
                        value={config.zapiApiKey}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="Sua API Key da Z-API"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKeys(prev => ({ ...prev, zapi: !prev.zapi }))}
                      >
                        {showApiKeys.zapi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zapiInstanceId">Instance ID</Label>
                    <Input
                      id="zapiInstanceId"
                      name="zapiInstanceId"
                      value={config.zapiInstanceId}
                      onChange={(e) => handleInputChange(e)}
                      placeholder="ID da sua instância Z-API"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zapiBaseUrl">Base URL</Label>
                  <Input
                    id="zapiBaseUrl"
                    name="zapiBaseUrl"
                    value={config.zapiBaseUrl}
                    onChange={(e) => handleInputChange(e)}
                    placeholder="https://api.z-api.io"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zapiClientToken">Client-Token (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="zapiClientToken"
                      name="zapiClientToken"
                      type={showApiKeys.zapiClientToken ? "text" : "password"}
                      value={config.zapiClientToken}
                      onChange={(e) => handleInputChange(e)}
                      placeholder="Token de segurança adicional (se configurado na Z-API)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, zapiClientToken: !prev.zapiClientToken }))}
                    >
                      {showApiKeys.zapiClientToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Necessário apenas se você ativou o "Account Security Token" no painel da Z-API
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={testConnection}
                    disabled={testing}
                    variant="outline"
                  >
                    {testing ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Verificar Status
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t pt-4 mt-4 space-y-2">
                  <Label htmlFor="testPhone">Enviar Mensagem de Teste</Label>
                  <p className="text-sm text-muted-foreground">
                    Use o formato internacional, sem espaços ou símbolos (ex: 5511999998888).
                  </p>
                  <Input
                    id="testPhone"
                    name="testPhone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Número do telefone"
                  />
                  <Input
                    id="testMessage"
                    name="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Sua mensagem de teste"
                  />
                  <Button onClick={sendTestMessage} disabled={sendingTest} className="w-full">
                    {sendingTest ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar Mensagem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuração OpenAI
                </CardTitle>
                <CardDescription>
                  Configure o modelo de IA e parâmetros de resposta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="openaiApiKey"
                      name="openaiApiKey"
                      type={showApiKeys.openai ? "text" : "password"}
                      value={config.openaiApiKey}
                      onChange={(e) => handleInputChange(e)}
                      placeholder="sk-..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, openai: !prev.openai }))}
                    >
                      {showApiKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openaiModel">Modelo</Label>
                    <select
                      id="openaiModel"
                      name="openaiModel"
                      value={config.openaiModel}
                      onChange={(e) => handleInputChange(e)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="openaiTemperature">Temperatura ({config.openaiTemperature})</Label>
                    <input
                      id="openaiTemperature"
                      name="openaiTemperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.openaiTemperature}
                      onChange={(e) => handleInputChange(e)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="openaiMaxTokens">Max Tokens</Label>
                    <Input
                      id="openaiMaxTokens"
                      name="openaiMaxTokens"
                      type="number"
                      value={config.openaiMaxTokens}
                      onChange={(e) => handleInputChange(e)}
                      min="100"
                      max="4000"
                    />
                  </div>
                </div>

                {/* Nova seção para Delay Humanizado */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    🤖 Delay Humanizado
                  </h4>
                  <p className="text-sm text-blue-600 mb-3">
                    Configure um delay aleatório entre as respostas para simular digitação humana e tornar a conversa mais natural
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responseDelayMin" className="text-blue-700">
                        Delay Mínimo (segundos)
                      </Label>
                      <Input
                        id="responseDelayMin"
                        name="responseDelayMin"
                        type="number"
                        value={config.responseDelayMin}
                        onChange={(e) => handleInputChange(e)}
                        min="1"
                        max="10"
                        className="border-blue-200 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responseDelayMax" className="text-blue-700">
                        Delay Máximo (segundos)
                      </Label>
                      <Input
                        id="responseDelayMax"
                        name="responseDelayMax"
                        type="number"
                        value={config.responseDelayMax}
                        onChange={(e) => handleInputChange(e)}
                        min="1"
                        max="30"
                        className="border-blue-200 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                    💡 <strong>Exemplo:</strong> Min 2s, Max 5s = Delay aleatório entre 2-5 segundos antes de cada resposta
                    <br />
                    ⚡ Recomendado: 2-5 segundos para conversas naturais
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuração de Prompts
                </CardTitle>
                <CardDescription>
                  Personalize as mensagens e comportamento da IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                  <textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    value={config.systemPrompt}
                    onChange={(e) => handleInputChange(e)}
                    rows={10}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md resize-none"
                    placeholder="Instruções para a IA sobre como se comportar..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                    <textarea
                      id="welcomeMessage"
                      name="welcomeMessage"
                      value={config.welcomeMessage}
                      onChange={(e) => handleInputChange(e)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fallbackMessage">Mensagem de Fallback</Label>
                    <textarea
                      id="fallbackMessage"
                      name="fallbackMessage"
                      value={config.fallbackMessage}
                      onChange={(e) => handleInputChange(e)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="handoffMessage">Mensagem de Transferência</Label>
                    <textarea
                      id="handoffMessage"
                      name="handoffMessage"
                      value={config.handoffMessage}
                      onChange={(e) => handleInputChange(e)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  URLs de Webhook
                </CardTitle>
                <CardDescription>
                  Configure os endpoints para diferentes tipos de eventos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(config.webhookUrls).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        name={key}
                        value={value}
                        onChange={(e) => handleWebhookChange(e)}
                        placeholder={`https://your-webhook-url.com/${key}`}
                      />
                      {value && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(value, key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connection">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Status da Conexão
                  </CardTitle>
                  <CardDescription>
                    Monitore e gerencie a conexão WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connectionStatus || 'disconnected')}
                      <div>
                        <p className="font-medium">{translateStatus(connectionStatus)}</p>
                        <p className="text-sm text-muted-foreground">
                          {lastStatusCheck && `Verificado: ${new Date(lastStatusCheck).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(connectionStatus || 'disconnected')} text-white`}>
                      {translateStatus(connectionStatus)}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={checkStatus}
                      disabled={checkingStatus}
                      variant="outline"
                      className="flex-1"
                    >
                      {checkingStatus ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <Wifi className="mr-2 h-4 w-4" />
                          Verificar Status
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={generateQRCode}
                      disabled={generatingQR}
                      className="flex-1"
                    >
                      {generatingQR ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Gerar QR Code
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {qrCodeImage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      QR Code
                    </CardTitle>
                    <CardDescription>
                      Escaneie com o WhatsApp para conectar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <img 
                      src={qrCodeImage} 
                      alt="QR Code WhatsApp" 
                      className="max-w-full h-auto border rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status da Conexão</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{translateStatus(config.connectionStatus)}</div>
                  <p className="text-xs text-muted-foreground">
                    Última verificação: {config.lastStatusCheck ? new Date(config.lastStatusCheck).toLocaleString() : 'Nunca'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Configurar Webhook</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={configureWebhook} 
                    disabled={isConfiguringWebhook}
                    className="w-full"
                  >
                    {isConfiguringWebhook ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      'Configurar Webhook'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="fixed bottom-6 right-6">
          <Button
            onClick={saveConfig}
            disabled={saving}
            size="lg"
            className="shadow-lg"
          >
            {saving ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>

        {/* Nova Seção: Diagnóstico do Webhook */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">🔍 Diagnóstico do Webhook</h2>
              <p className="text-gray-600 mt-1">Verifique por que as mensagens do WhatsApp não estão chegando</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/webhook-diagnostics')
                    const result = await response.json()
                    console.log('Diagnóstico:', result)
                    
                    if (result.status === 'ok') {
                      toast.success('✅ Webhook configurado corretamente!')
                    } else {
                      toast.error(`❌ Problemas encontrados: ${result.diagnostics.issues.length} issues`)
                      console.error('Issues:', result.diagnostics.issues)
                    }
                  } catch (error) {
                    toast.error('Erro ao fazer diagnóstico')
                    console.error(error)
                  }
                }}
              >
                🔍 Diagnosticar
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/webhook-diagnostics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'fix_webhook' })
                    })
                    const result = await response.json()
                    
                    if (result.success) {
                      toast.success('✅ Webhook corrigido com sucesso!')
                    } else {
                      toast.error(`❌ Erro ao corrigir: ${result.error}`)
                    }
                  } catch (error) {
                    toast.error('Erro ao corrigir webhook')
                    console.error(error)
                  }
                }}
              >
                🔧 Corrigir Webhook
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">🚨 Possíveis Problemas</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Webhook não configurado na Z-API</li>
              <li>• URL do webhook incorreta</li>
              <li>• WhatsApp não conectado</li>
              <li>• Credenciais Z-API inválidas</li>
              <li>• Variável NEXT_PUBLIC_BASE_URL não configurada</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-100 rounded text-sm">
              <strong>💡 Dica:</strong> Se o diagnóstico mostrar problemas, clique em "Corrigir Webhook" para tentar resolver automaticamente.
            </div>
          </div>
        </Card>

        {/* Nova Seção: Simulação/Treinamento da IA */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">🤖 Simulação & Treinamento da IA</h2>
              <p className="text-gray-600 mt-1">Teste diferentes prompts e mensagens para treinar sua IA</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSimulationMode(!simulationMode)}
                className={simulationMode ? 'bg-blue-50 border-blue-200' : ''}
              >
                {simulationMode ? '✓ Modo Ativo' : '▶️ Ativar Simulação'}
              </Button>
              {simulationMode && (
                <Button
                  variant="outline"
                  onClick={clearTestConversation}
                  className="text-gray-600 hover:text-red-600"
                >
                  🗑️ Limpar
                </Button>
              )}
            </div>
          </div>

          {simulationMode && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat de Teste */}
              <div className="space-y-4">
                <h3 className="font-medium">💬 Chat de Teste</h3>
                
                {/* Área da Conversa */}
                <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-gray-50">
                  {testConversation.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <div className="text-4xl mb-2">🤖</div>
                      <p>Envie uma mensagem para começar o teste</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testConversation.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border shadow-sm'
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div className={`text-xs mt-1 ${
                              msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTestingAI && (
                        <div className="flex justify-start">
                          <div className="bg-white border shadow-sm px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full"></div>
                              <span className="text-gray-500 text-sm">IA pensando...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Input da Mensagem */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isTestingAI && testAIResponse()}
                    placeholder="Digite sua mensagem de teste..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isTestingAI}
                  />
                  <Button
                    onClick={testAIResponse}
                    disabled={!testMessage.trim() || isTestingAI}
                    className="px-6"
                  >
                    {isTestingAI ? (
                      <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                    ) : (
                      '📤'
                    )}
                  </Button>
                </div>
              </div>

              {/* Informações e Controles */}
              <div className="space-y-4">
                <h3 className="font-medium">⚙️ Configurações do Teste</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Prompt Sistema Atual:</label>
                    <div className="mt-1 p-2 bg-white border rounded text-sm max-h-24 overflow-y-auto">
                      {config.systemPrompt || 'Nenhum prompt configurado'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Modelo:</span>
                      <div className="font-medium">{config.openaiModel}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Temperatura:</span>
                      <div className="font-medium">{config.openaiTemperature}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Dicas de Teste</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Teste diferentes tipos de pergunta</li>
                    <li>• Verifique se o tom está adequado</li>
                    <li>• Teste cenários de agendamento</li>
                    <li>• Experimente perguntas sobre preços</li>
                    <li>• Teste pedidos de transferência</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Status da Configuração</h4>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center ${config.openaiApiKey ? 'text-green-700' : 'text-red-700'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${config.openaiApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      OpenAI API {config.openaiApiKey ? 'Configurada' : 'Não Configurada'}
                    </div>
                    <div className={`flex items-center ${config.systemPrompt ? 'text-green-700' : 'text-orange-700'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${config.systemPrompt ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      Prompt Sistema {config.systemPrompt ? 'Definido' : 'Vazio'}
                    </div>
                    <div className={`flex items-center ${config.zapiApiKey && config.zapiInstanceId ? 'text-green-700' : 'text-red-700'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${config.zapiApiKey && config.zapiInstanceId ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      Z-API {config.zapiApiKey && config.zapiInstanceId ? 'Configurada' : 'Não Configurada'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}

const ConnectionStatusBadge = ({ status }: { status: string | null }) => {
  const statusInfo = {
    connected: { text: 'Conectado', color: 'bg-green-500' },
    disconnected: { text: 'Desconectado', color: 'bg-red-500' },
    checking: { text: 'Verificando...', color: 'bg-yellow-500' },
    error: { text: 'Erro', color: 'bg-red-700' },
  }

  const currentStatus = status && statusInfo[status as keyof typeof statusInfo] ? statusInfo[status as keyof typeof statusInfo] : { text: 'Indefinido', color: 'bg-gray-500' }

  return (
    <div className="flex items-center space-x-2">
      <span className={`h-3 w-3 rounded-full ${currentStatus.color}`}></span>
      <span className="text-sm font-medium">Status: {currentStatus.text}</span>
    </div>
  )
}

const ConnectionStatusPill = ({ status }: { status: string | null }) => {
  const statusInfo = {
    connected: { text: 'Conectado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    disconnected: { text: 'Desconectado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    checking: { text: 'Verificando...', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    error: { text: 'Erro', color: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100' },
  }
  
  const currentStatus = status && statusInfo[status as keyof typeof statusInfo] ? statusInfo[status as keyof typeof statusInfo] : { text: 'Indefinido', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.color}`}>
      {currentStatus.text}
    </span>
  )
}