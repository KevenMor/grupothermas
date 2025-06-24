'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Loader2,
  BookOpen,
  HelpCircle,
  Package,
  FileText,
  Plus,
  Trash2,
  User
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
  welcomeMessage: 'Olá! Sou o assistente virtual do Grupo Thermas. Como posso ajudá-lo a encontrar a experiência termal perfeita para você?',
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

  // Estados para teste de mídia
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'audio' | 'video' | 'document'>('text')
  const [mediaContent, setMediaContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaCaption, setMediaCaption] = useState('')
  const [fileName, setFileName] = useState('')
  const [sendingMedia, setSendingMedia] = useState(false)

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
      setCheckingStatus(true)
      const response = await fetch('/api/admin/status')
      const data = await response.json()

      if (response.ok && data.connected) {
        toast.success('✅ Z-API conectado com sucesso!', { id: toastId })
        setConnectionStatus('connected')
        setLastStatusCheck(new Date().toISOString())
        
        // Salvar status no Firebase
        const updatedConfig = {
          ...config,
          connectionStatus: 'connected',
          lastStatusCheck: new Date().toISOString(),
          lastConnection: new Date().toISOString()
        }
        setConfig(updatedConfig)
        
        // Salvar no Firebase
        await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfig)
        })
        
      } else {
        toast.error(data.error || 'Z-API desconectado', { id: toastId })
        setConnectionStatus('disconnected')
        
        // Salvar status desconectado
        const updatedConfig = {
          ...config,
          connectionStatus: 'disconnected',
          lastStatusCheck: new Date().toISOString()
        }
        setConfig(updatedConfig)
        
        await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfig)
        })
      }
    } catch (error) {
      console.error("Check status error:", error)
      toast.error('Erro de rede ao verificar status.', { id: toastId })
      setConnectionStatus('error')
    } finally {
      setCheckingStatus(false)
    }
  }

  const generateQRCode = async () => {
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      toast.error('Configure as credenciais Z-API primeiro')
      return
    }

    setGeneratingQR(true)
    const toastId = toast.loading('Gerando QR Code...')
    try {
      const response = await fetch('/api/admin/qr-code', { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.qrCode) {
        // Verificar se é uma URL ou dados base64
        let qrCodeUrl = data.qrCode
        if (typeof data.qrCode === 'object' && data.qrCode.qrcode) {
          qrCodeUrl = data.qrCode.qrcode
        }
        
        setQrCodeImage(qrCodeUrl)
        toast.success('QR Code gerado com sucesso! Escaneie com seu WhatsApp.', { id: toastId })
        
        // Salvar QR Code no config
        const updatedConfig = {
          ...config,
          qrCodeUrl: qrCodeUrl,
          connectionStatus: 'qr_code',
          updatedAt: new Date().toISOString()
        }
        setConfig(updatedConfig)
        setConnectionStatus('qr_code')
        
        // Salvar no Firebase
        await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfig)
        })
        
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
      qr_code: 'QR Code Gerado',
      connecting: 'Conectando...',
      error: 'Erro'
    }
    return translations[status] || 'Indefinido'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-orange-500'
      case 'qr_code': return 'bg-blue-500'
      case 'checking': return 'bg-yellow-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'connecting': return <Loader className="h-4 w-4 animate-spin" />
      case 'qr_code': return <QrCode className="h-4 w-4" />
      case 'checking': return <Loader className="h-4 w-4 animate-spin" />
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

  const sendMediaMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite o número do telefone')
      return
    }

    if (mediaType === 'text' && !mediaContent.trim()) {
      toast.error('Digite uma mensagem')
      return
    }

    if (['image', 'audio', 'video', 'document'].includes(mediaType) && !mediaUrl.trim()) {
      toast.error('Digite a URL da mídia')
      return
    }

    setSendingMedia(true)

    try {
      const payload: any = {
        phone: testPhone,
        type: mediaType
      }

      if (mediaType === 'text') {
        payload.content = mediaContent
      } else {
        payload.url = mediaUrl
        if (mediaCaption && (mediaType === 'image' || mediaType === 'video')) {
          payload.caption = mediaCaption
        }
        if (fileName && mediaType === 'document') {
          payload.filename = fileName
        }
      }

      const response = await fetch('/api/admin/send-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        
        // Limpar campos após envio bem-sucedido
        if (mediaType === 'text') {
          setMediaContent('')
        } else {
          setMediaUrl('')
          setMediaCaption('')
          setFileName('')
        }
      } else {
        toast.error(result.error || 'Erro ao enviar mídia')
        console.error('Erro detalhado:', result)
      }
    } catch (error) {
      console.error('Erro ao enviar mídia:', error)
      toast.error('Erro de rede ao enviar mídia')
    } finally {
      setSendingMedia(false)
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
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header moderno */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                Configuração da IA
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Configure e monitore sua assistente virtual inteligente
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Status do Sistema</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="ai-config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger value="ai-config" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <Bot className="h-4 w-4" />
              Configuração IA
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <BookOpen className="h-4 w-4" />
              Treinamento
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <Wifi className="h-4 w-4" />
              Integração
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <TestTube className="h-4 w-4" />
              Testes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-config">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuração OpenAI */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-blue-600" />
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
                        onChange={handleInputChange}
                        placeholder="sk-..."
                        className="pr-10"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openaiModel">Modelo</Label>
                      <select
                        id="openaiModel"
                        name="openaiModel"
                        value={config.openaiModel}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        <option value="gpt-4o-mini">GPT-4 Mini (Econômico)</option>
                        <option value="gpt-4o">GPT-4 (Avançado)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="openaiTemperature">Criatividade ({config.openaiTemperature})</Label>
                      <input
                        type="range"
                        id="openaiTemperature"
                        name="openaiTemperature"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.openaiTemperature}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Conservador</span>
                        <span>Criativo</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openaiMaxTokens">Máximo de Tokens</Label>
                    <Input
                      id="openaiMaxTokens"
                      name="openaiMaxTokens"
                      type="number"
                      value={config.openaiMaxTokens}
                      onChange={handleInputChange}
                      min="100"
                      max="4000"
                    />
                    <p className="text-xs text-gray-500">Controla o tamanho máximo das respostas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Delay Humanizado */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Delay Humanizado
                  </CardTitle>
                  <CardDescription>
                    Configure delays para tornar as respostas mais naturais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responseDelayMin">Delay Mínimo (segundos)</Label>
                      <Input
                        id="responseDelayMin"
                        name="responseDelayMin"
                        type="number"
                        value={config.responseDelayMin}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responseDelayMax">Delay Máximo (segundos)</Label>
                      <Input
                        id="responseDelayMax"
                        name="responseDelayMax"
                        type="number"
                        value={config.responseDelayMax}
                        onChange={handleInputChange}
                        min="2"
                        max="15"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Recomendação:</strong> Use 2-5 segundos para simular tempo de digitação humano
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prompt do Sistema */}
            <Card className="mt-6 shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Prompt do Sistema
                </CardTitle>
                <CardDescription>
                  Configure a personalidade e comportamento da IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Instruções para a IA</Label>
                  <textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    value={config.systemPrompt}
                    onChange={handleInputChange}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-mono text-sm"
                    placeholder="Digite as instruções para configurar o comportamento da IA..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                    <textarea
                      id="welcomeMessage"
                      name="welcomeMessage"
                      value={config.welcomeMessage}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fallbackMessage">Mensagem de Erro</Label>
                    <textarea
                      id="fallbackMessage"
                      name="fallbackMessage"
                      value={config.fallbackMessage}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="handoffMessage">Mensagem de Transferência</Label>
                    <textarea
                      id="handoffMessage"
                      name="handoffMessage"
                      value={config.handoffMessage}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <TrainingSection />
          </TabsContent>

          <TabsContent value="integration">
            <div className="space-y-6">
              {/* Z-API Configuration */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wifi className="h-5 w-5 text-green-600" />
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
                          onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                        onChange={handleInputChange}
                        placeholder="Token de segurança adicional"
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
                  </div>

                  {/* Status da Conexão */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Status da Conexão</h4>
                      <Button onClick={checkStatus} disabled={checkingStatus} variant="outline" size="sm">
                        {checkingStatus ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Verificar
                      </Button>
                    </div>
                    <ConnectionStatusPill status={connectionStatus} />
                  </div>

                  {/* QR Code */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">QR Code WhatsApp</h4>
                      <Button onClick={generateQRCode} disabled={generatingQR} variant="outline" size="sm">
                        {generatingQR ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="mr-2 h-4 w-4" />
                        )}
                        Gerar QR Code
                      </Button>
                    </div>
                    {qrCodeImage && (
                      <div className="flex justify-center">
                        <img src={qrCodeImage} alt="QR Code" className="max-w-xs border rounded-lg" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Diagnostics */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Webhook className="h-5 w-5 text-purple-600" />
                    Diagnóstico de Webhook
                  </CardTitle>
                  <CardDescription>
                    Verifique e corrija problemas de configuração
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/webhook-diagnostics')
                          const result = await response.json()
                          console.log('Diagnóstico completo:', result)
                          
                          if (result.status === 'ok') {
                            toast.success('Webhook configurado corretamente!')
                          } else if (result.status === 'error') {
                            if (result.diagnostics?.issues?.length > 0) {
                              const mainIssue = result.diagnostics.issues[0]
                              toast.error(`${mainIssue.message}`)
                              console.error('Issues detalhados:', result.diagnostics.issues)
                            } else {
                              toast.error(`${result.error || 'Erro desconhecido'}`)
                            }
                          } else {
                            const issueCount = result.diagnostics?.issues?.length || 0
                            if (issueCount > 0) {
                              toast.warning(`${issueCount} problema(s) encontrado(s)`)
                              console.warn('Issues:', result.diagnostics.issues)
                            } else {
                              toast.success('Nenhum problema encontrado')
                            }
                          }
                        } catch (error) {
                          console.error('Erro completo:', error)
                          toast.error('Erro ao fazer diagnóstico - verifique o console')
                        }
                      }}
                    >
                      Diagnosticar
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
                          console.log('Resultado da correção:', result)
                          
                          if (result.success) {
                            toast.success('Webhook corrigido com sucesso!')
                          } else {
                            const errorMsg = result.error || result.message || 'Erro desconhecido'
                            toast.error(`Erro na correção: ${errorMsg}`)
                            if (result.details) {
                              console.error('Detalhes do erro:', result.details)
                            }
                          }
                        } catch (error) {
                          console.error('Erro completo na correção:', error)
                          toast.error('Erro ao corrigir webhook - verifique o console')
                        }
                      }}
                    >
                      Corrigir Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="testing">
            <div className="space-y-6">
              {/* Teste de Mídia Completo */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Send className="h-5 w-5 text-blue-600" />
                    Teste de Envio de Mídia
                  </CardTitle>
                  <CardDescription>
                    Teste envio de texto, áudio, imagem, vídeo e documentos via Z-API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Número do telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="testPhone">Número do telefone</Label>
                    <Input
                      id="testPhone"
                      name="testPhone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="5511999998888 (formato internacional)"
                    />
                    <p className="text-sm text-gray-500">
                      Use o formato internacional, sem espaços ou símbolos
                    </p>
                  </div>

                  {/* Seletor de tipo de mídia */}
                  <div className="space-y-2">
                    <Label>Tipo de Mídia</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { type: 'text', label: 'Texto', icon: 'T' },
                        { type: 'image', label: 'Imagem', icon: 'IMG' },
                        { type: 'audio', label: 'Áudio', icon: 'MP3' },
                        { type: 'video', label: 'Vídeo', icon: 'MP4' },
                        { type: 'document', label: 'PDF', icon: 'PDF' }
                      ].map(({ type, label, icon }) => (
                        <button
                          key={type}
                          onClick={() => setMediaType(type as any)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            mediaType === type
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-bold mb-1 text-gray-600">{icon}</div>
                          <div className="text-xs font-medium">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campos específicos por tipo */}
                  {mediaType === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="textContent">Mensagem de texto</Label>
                      <textarea
                        id="textContent"
                        value={mediaContent}
                        onChange={(e) => setMediaContent(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      />
                    </div>
                  )}

                  {['image', 'audio', 'video', 'document'].includes(mediaType) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="mediaUrl">URL da {mediaType === 'document' ? 'documento' : 'mídia'}</Label>
                        <Input
                          id="mediaUrl"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder={`https://exemplo.com/arquivo.${
                            mediaType === 'image' ? 'jpg' :
                            mediaType === 'audio' ? 'mp3' :
                            mediaType === 'video' ? 'mp4' : 'pdf'
                          }`}
                        />
                        <p className="text-sm text-gray-500">
                          URL pública do arquivo {mediaType === 'document' ? 'PDF' : mediaType}
                        </p>
                      </div>

                      {(mediaType === 'image' || mediaType === 'video') && (
                        <div className="space-y-2">
                          <Label htmlFor="mediaCaption">Legenda (opcional)</Label>
                          <Input
                            id="mediaCaption"
                            value={mediaCaption}
                            onChange={(e) => setMediaCaption(e.target.value)}
                            placeholder="Adicione uma legenda..."
                          />
                        </div>
                      )}

                      {mediaType === 'document' && (
                        <div className="space-y-2">
                          <Label htmlFor="fileName">Nome do arquivo (opcional)</Label>
                          <Input
                            id="fileName"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="documento.pdf"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* URLs de exemplo */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">URLs de exemplo para teste:</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Imagem:</strong> https://picsum.photos/800/600</div>
                      <div><strong>Áudio:</strong> https://www.soundjay.com/misc/sounds/bell-ringing-05.wav</div>
                      <div><strong>Vídeo:</strong> https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4</div>
                      <div><strong>PDF:</strong> https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf</div>
                    </div>
                  </div>
                  
                  <Button onClick={sendMediaMessage} disabled={sendingMedia} className="w-full">
                    {sendingMedia ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar {mediaType === 'text' ? 'Mensagem' : mediaType === 'document' ? 'Documento' : 'Mídia'}
                  </Button>
                </CardContent>
              </Card>

              {/* Simulação da IA */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-green-600" />
                    Simulação da IA
                  </CardTitle>
                  <CardDescription>
                    Teste diferentes prompts e mensagens para treinar sua IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSimulationMode(!simulationMode)}
                        className={simulationMode ? 'bg-blue-50 border-blue-200' : ''}
                      >
                        {simulationMode ? 'Modo Ativo' : 'Ativar Simulação'}
                      </Button>
                      {simulationMode && (
                        <Button
                          variant="outline"
                          onClick={clearTestConversation}
                          className="text-gray-600 hover:text-red-600"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>

                  {simulationMode && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chat de Teste */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Chat de Teste</h3>
                        
                        {/* Área da Conversa */}
                        <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-gray-50">
                          {testConversation.length === 0 ? (
                                                         <div className="text-center text-gray-500 mt-20">
                               <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                              'Enviar'
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Informações e Controles */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Configurações do Teste</h3>
                        
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
                          <h4 className="font-medium text-blue-800 mb-2">Dicas de Teste</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Teste diferentes tipos de pergunta</li>
                            <li>• Verifique se o tom está adequado</li>
                            <li>• Teste cenários de agendamento</li>
                            <li>• Experimente perguntas sobre preços</li>
                            <li>• Teste pedidos de transferência</li>
                          </ul>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Status da Configuração</h4>
                          <div className="space-y-2 text-sm">
                            <div className={`flex items-center ${config.openaiApiKey ? 'text-green-700' : 'text-red-700'}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${config.openaiApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              OpenAI API {config.openaiApiKey ? 'Configurada' : 'Não Configurada'}
                            </div>
                            <div className={`flex items-center ${config.zapiApiKey ? 'text-green-700' : 'text-red-700'}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${config.zapiApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              Z-API {config.zapiApiKey ? 'Configurada' : 'Não Configurada'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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





        {/* Botão de Salvar Fixo */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={saveConfig}
            disabled={saving}
            size="lg"
            className="shadow-lg"
          >
            {saving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}

// Componente de Treinamento da IA
const TrainingSection = () => {
  const [activeTrainingTab, setActiveTrainingTab] = React.useState<'faq' | 'products' | 'policies' | 'personality'>('faq')
  const [faqItems, setFaqItems] = React.useState<Array<{id: string, question: string, answer: string}>>([])
  const [products, setProducts] = React.useState<Array<{id: string, name: string, description: string, price: string}>>([])
  const [policies, setPolicies] = React.useState<Array<{id: string, title: string, content: string}>>([])
  const [personality, setPersonality] = React.useState({
    tone: 'professional',
    style: 'helpful',
    greeting: 'Olá! Como posso ajudá-lo hoje?',
    signature: 'Atenciosamente, Equipe Grupo Thermas'
  })
  const [loadingTraining, setLoadingTraining] = React.useState(true)

  // Carregar dados de treinamento ao montar o componente
  React.useEffect(() => {
    const loadTrainingData = async () => {
      try {
        setLoadingTraining(true)
        const response = await fetch('/api/admin/training')
        if (response.ok) {
          const data = await response.json()
          setFaqItems(data.faq || [])
          setProducts(data.products || [])
          setPolicies(data.policies || [])
          setPersonality(data.personality || {
            tone: 'professional',
            style: 'helpful',
            greeting: 'Olá! Como posso ajudá-lo hoje?',
            signature: 'Atenciosamente, Equipe Grupo Thermas'
          })
        }
      } catch (error) {
        console.error('Erro ao carregar dados de treinamento:', error)
        toast.error('Erro ao carregar dados de treinamento')
      } finally {
        setLoadingTraining(false)
      }
    }
    
    loadTrainingData()
  }, [])

  // FAQ Functions
  const addFaqItem = () => {
    const newFaq = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    }
    setFaqItems([...faqItems, newFaq])
  }

  const updateFaqItem = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqItems(faqItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeFaqItem = (id: string) => {
    setFaqItems(faqItems.filter(item => item.id !== id))
  }

  // Products Functions
  const addProduct = () => {
    const newProduct = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: ''
    }
    setProducts([...products, newProduct])
  }

  const updateProduct = (id: string, field: 'name' | 'description' | 'price', value: string) => {
    setProducts(products.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter(item => item.id !== id))
  }

  // Policies Functions
  const addPolicy = () => {
    const newPolicy = {
      id: Date.now().toString(),
      title: '',
      content: ''
    }
    setPolicies([...policies, newPolicy])
  }

  const updatePolicy = (id: string, field: 'title' | 'content', value: string) => {
    setPolicies(policies.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removePolicy = (id: string) => {
    setPolicies(policies.filter(item => item.id !== id))
  }

  // Save Training Data
  const saveTrainingData = async () => {
    try {
      const trainingData = {
        faq: faqItems,
        products,
        policies,
        personality,
        updatedAt: new Date().toISOString()
      }

      const response = await fetch('/api/admin/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData)
      })

      if (response.ok) {
        toast.success('Dados de treinamento salvos com sucesso!')
      } else {
        throw new Error('Falha ao salvar')
      }
    } catch (error) {
      toast.error('Erro ao salvar dados de treinamento')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Treinamento da IA
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure o conhecimento e personalidade da IA
          </p>
        </div>
        <Button onClick={saveTrainingData} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          Salvar Treinamento
        </Button>
      </div>

      {/* Training Tabs */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
              { id: 'products', label: 'Produtos', icon: Package },
              { id: 'policies', label: 'Políticas', icon: FileText },
              { id: 'personality', label: 'Personalidade', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTrainingTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTrainingTab === id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* FAQ Tab */}
          {activeTrainingTab === 'faq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Perguntas Frequentes</h3>
                <Button onClick={addFaqItem} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar FAQ
                </Button>
              </div>
              
              {faqItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma pergunta frequente cadastrada</p>
                  <p className="text-sm">Clique em "Adicionar FAQ" para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faqItems.map((item) => (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Digite a pergunta..."
                              value={item.question}
                              onChange={(e) => updateFaqItem(item.id, 'question', e.target.value)}
                            />
                            <textarea
                              placeholder="Digite a resposta..."
                              value={item.answer}
                              onChange={(e) => updateFaqItem(item.id, 'answer', e.target.value)}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[100px] resize-vertical"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFaqItem(item.id)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTrainingTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Catálogo de Produtos/Serviços</h3>
                <Button onClick={addProduct} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum produto cadastrado</p>
                  <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((item) => (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nome do produto/serviço..."
                              value={item.name}
                              onChange={(e) => updateProduct(item.id, 'name', e.target.value)}
                            />
                            <textarea
                              placeholder="Descrição detalhada..."
                              value={item.description}
                              onChange={(e) => updateProduct(item.id, 'description', e.target.value)}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[80px] resize-vertical"
                            />
                            <Input
                              placeholder="Preço (ex: R$ 199,90)"
                              value={item.price}
                              onChange={(e) => updateProduct(item.id, 'price', e.target.value)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(item.id)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Policies Tab */}
          {activeTrainingTab === 'policies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Políticas da Empresa</h3>
                <Button onClick={addPolicy} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Política
                </Button>
              </div>
              
              {policies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma política cadastrada</p>
                  <p className="text-sm">Clique em "Adicionar Política" para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((item) => (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Título da política..."
                              value={item.title}
                              onChange={(e) => updatePolicy(item.id, 'title', e.target.value)}
                            />
                            <textarea
                              placeholder="Conteúdo da política..."
                              value={item.content}
                              onChange={(e) => updatePolicy(item.id, 'content', e.target.value)}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[120px] resize-vertical"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePolicy(item.id)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Personality Tab */}
          {activeTrainingTab === 'personality' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configuração de Personalidade</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tom de Voz</Label>
                    <select
                      value={personality.tone}
                      onChange={(e) => setPersonality(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="professional">Profissional</option>
                      <option value="friendly">Amigável</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Estilo de Atendimento</Label>
                    <select
                      value={personality.style}
                      onChange={(e) => setPersonality(prev => ({ ...prev, style: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="helpful">Prestativo</option>
                      <option value="consultative">Consultivo</option>
                      <option value="direct">Direto</option>
                      <option value="empathetic">Empático</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem de Saudação</Label>
                    <textarea
                      value={personality.greeting}
                      onChange={(e) => setPersonality(prev => ({ ...prev, greeting: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[80px] resize-vertical"
                      placeholder="Como a IA deve cumprimentar os clientes..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assinatura</Label>
                    <Input
                      value={personality.signature}
                      onChange={(e) => setPersonality(prev => ({ ...prev, signature: e.target.value }))}
                      placeholder="Como a IA deve se despedir..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Prévia da Personalidade
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p><strong>Tom:</strong> {personality.tone}</p>
                  <p><strong>Estilo:</strong> {personality.style}</p>
                  <p><strong>Saudação:</strong> "{personality.greeting}"</p>
                  <p><strong>Assinatura:</strong> "{personality.signature}"</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
    qr_code: { text: 'QR Code Gerado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    connecting: { text: 'Conectando...', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    error: { text: 'Erro', color: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100' },
  }
  
  const currentStatus = status && statusInfo[status as keyof typeof statusInfo] ? statusInfo[status as keyof typeof statusInfo] : { text: 'Indefinido', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.color}`}>
      {currentStatus.text}
    </span>
  )
}