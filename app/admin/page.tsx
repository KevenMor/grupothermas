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
  updatedAt: ''
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
  const [testMessage, setTestMessage] = useState('Esta é uma mensagem de teste.')
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
        toast.error(data.error || 'Falha ao carregar configurações.')
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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