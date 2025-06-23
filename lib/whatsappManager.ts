import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import QRCode from 'qrcode'
import { adminDB } from './firebaseAdmin'
import { Server } from 'socket.io'
import OpenAI from 'openai'
import axios from 'axios'

interface WhatsAppSession {
  id: string
  name: string
  client: Client | null
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  aiEnabled: boolean
  n8nWebhook?: string
  aiConfig?: {
    model: string
    systemPrompt: string
    apiKey: string
  }
}

class WhatsAppManager {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private io: Server | null = null
  private openai: OpenAI | null = null

  constructor() {
    // Inicializar OpenAI se a chave estiver disponível
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }

  setSocketIO(io: Server) {
    this.io = io
  }

  async createSession(sessionId: string, sessionName: string): Promise<void> {
    if (this.sessions.has(sessionId)) {
      throw new Error('Sessão já existe')
    }

    const session: WhatsAppSession = {
      id: sessionId,
      name: sessionName,
      client: null,
      status: 'disconnected',
      aiEnabled: false
    }

    this.sessions.set(sessionId, session)
    await this.updateSessionInDB(sessionId, { status: 'disconnected' })
  }

  async startSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Sessão não encontrada')
    }

    if (session.client) {
      await this.stopSession(sessionId)
    }

    // Criar novo cliente WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    })

    session.client = client
    session.status = 'connecting'
    await this.updateSessionInDB(sessionId, { status: 'connecting' })

    // Event listeners
    client.on('qr', async (qr) => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr)
        this.io?.emit('qr-code', { sessionId, qr: qrCodeDataURL })
        console.log(`QR Code gerado para sessão ${sessionId}`)
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error)
      }
    })

    client.on('ready', async () => {
      console.log(`Cliente WhatsApp conectado para sessão ${sessionId}`)
      session.status = 'connected'
      await this.updateSessionInDB(sessionId, { 
        status: 'connected',
        lastActivity: new Date()
      })
      this.io?.emit('session-status', { sessionId, status: 'connected' })

      // Obter informações do número
      const info = client.info
      if (info) {
        await this.updateSessionInDB(sessionId, {
          phone: info.wid.user,
          pushname: info.pushname
        })
      }
    })

    client.on('authenticated', () => {
      console.log(`Cliente autenticado para sessão ${sessionId}`)
    })

    client.on('auth_failure', async (msg) => {
      console.error(`Falha na autenticação para sessão ${sessionId}:`, msg)
      session.status = 'error'
      await this.updateSessionInDB(sessionId, { status: 'error' })
      this.io?.emit('session-status', { sessionId, status: 'error' })
    })

    client.on('disconnected', async (reason) => {
      console.log(`Cliente desconectado para sessão ${sessionId}:`, reason)
      session.status = 'disconnected'
      await this.updateSessionInDB(sessionId, { status: 'disconnected' })
      this.io?.emit('session-status', { sessionId, status: 'disconnected' })
    })

    client.on('message', async (message) => {
      await this.handleIncomingMessage(sessionId, message)
    })

    // Inicializar cliente
    try {
      await client.initialize()
    } catch (error) {
      console.error(`Erro ao inicializar cliente para sessão ${sessionId}:`, error)
      session.status = 'error'
      await this.updateSessionInDB(sessionId, { status: 'error' })
      this.io?.emit('session-status', { sessionId, status: 'error' })
    }
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.client) {
      return
    }

    try {
      await session.client.destroy()
      session.client = null
      session.status = 'disconnected'
      await this.updateSessionInDB(sessionId, { status: 'disconnected' })
      this.io?.emit('session-status', { sessionId, status: 'disconnected' })
    } catch (error) {
      console.error(`Erro ao parar sessão ${sessionId}:`, error)
    }
  }

  async handleIncomingMessage(sessionId: string, message: any): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      // Salvar mensagem no banco
      await this.saveMessage(sessionId, {
        id: message.id.id,
        from: message.from,
        to: message.to,
        body: message.body,
        type: message.type,
        timestamp: new Date(message.timestamp * 1000),
        fromMe: message.fromMe
      })

      // Incrementar contador de mensagens
      await this.updateSessionInDB(sessionId, {
        messagesCount: adminDB.FieldValue.increment(1),
        lastActivity: new Date()
      })

      // Enviar para N8N se configurado
      if (session.n8nWebhook) {
        await this.sendToN8N(session.n8nWebhook, {
          event: 'message_received',
          sessionId,
          message: {
            id: message.id.id,
            from: message.from,
            body: message.body,
            timestamp: message.timestamp
          }
        })
      }

      // Processar com IA se habilitado
      if (session.aiEnabled && !message.fromMe && session.client) {
        await this.processWithAI(sessionId, message)
      }

    } catch (error) {
      console.error(`Erro ao processar mensagem para sessão ${sessionId}:`, error)
    }
  }

  async processWithAI(sessionId: string, message: any): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.client || !this.openai) return

    try {
      // Buscar histórico recente de mensagens
      const messagesRef = adminDB
        .collection('whatsapp_messages')
        .where('sessionId', '==', sessionId)
        .where('from', '==', message.from)
        .orderBy('timestamp', 'desc')
        .limit(10)

      const messagesSnapshot = await messagesRef.get()
      const recentMessages = messagesSnapshot.docs.map(doc => doc.data())

      // Preparar contexto para IA
      const context = recentMessages.reverse().map(msg => 
        `${msg.fromMe ? 'Assistente' : 'Cliente'}: ${msg.body}`
      ).join('\n')

      const systemPrompt = session.aiConfig?.systemPrompt || `
        Você é um assistente virtual do Grupo Thermas. 
        Seja prestativo, profissional e responda de forma concisa.
        Se não souber algo, ofereça para transferir para um atendente humano.
      `

      // Gerar resposta com IA
      const completion = await this.openai.chat.completions.create({
        model: session.aiConfig?.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Contexto da conversa:\n${context}\n\nNova mensagem: ${message.body}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (aiResponse) {
        // Enviar resposta
        await session.client.sendMessage(message.from, aiResponse)

        // Salvar resposta da IA
        await this.saveMessage(sessionId, {
          id: `ai_${Date.now()}`,
          from: session.client.info.wid._serialized,
          to: message.from,
          body: aiResponse,
          type: 'chat',
          timestamp: new Date(),
          fromMe: true,
          isAI: true
        })

        // Enviar para N8N
        if (session.n8nWebhook) {
          await this.sendToN8N(session.n8nWebhook, {
            event: 'ai_response_sent',
            sessionId,
            originalMessage: message.body,
            aiResponse,
            from: message.from
          })
        }
      }

    } catch (error) {
      console.error(`Erro ao processar com IA para sessão ${sessionId}:`, error)
    }
  }

  async sendMessage(sessionId: string, to: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.client) {
      throw new Error('Sessão não encontrada ou não conectada')
    }

    await session.client.sendMessage(to, message)

    // Salvar mensagem enviada
    await this.saveMessage(sessionId, {
      id: `manual_${Date.now()}`,
      from: session.client.info.wid._serialized,
      to,
      body: message,
      type: 'chat',
      timestamp: new Date(),
      fromMe: true,
      isManual: true
    })
  }

  async updateAISettings(sessionId: string, aiEnabled: boolean, n8nWebhook?: string, aiConfig?: any): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Sessão não encontrada')
    }

    session.aiEnabled = aiEnabled
    session.n8nWebhook = n8nWebhook
    session.aiConfig = aiConfig

    await this.updateSessionInDB(sessionId, {
      aiEnabled,
      n8nWebhook,
      aiConfig
    })
  }

  private async updateSessionInDB(sessionId: string, data: any): Promise<void> {
    try {
      await adminDB.collection('whatsapp_sessions').doc(sessionId).update(data)
    } catch (error) {
      console.error(`Erro ao atualizar sessão ${sessionId} no banco:`, error)
    }
  }

  private async saveMessage(sessionId: string, messageData: any): Promise<void> {
    try {
      await adminDB.collection('whatsapp_messages').add({
        sessionId,
        ...messageData
      })
    } catch (error) {
      console.error(`Erro ao salvar mensagem para sessão ${sessionId}:`, error)
    }
  }

  private async sendToN8N(webhookUrl: string, data: any): Promise<void> {
    try {
      await axios.post(webhookUrl, data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      })
    } catch (error) {
      console.error('Erro ao enviar para N8N:', error)
    }
  }

  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values())
  }
}

export const whatsappManager = new WhatsAppManager()
export default whatsappManager 