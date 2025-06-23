// WhatsApp Manager apenas para servidor
let Client, LocalAuth, QRCode, axios

// Importações condicionais para evitar problemas no cliente
if (typeof window === 'undefined') {
  try {
    const whatsappWeb = require('whatsapp-web.js')
    Client = whatsappWeb.Client
    LocalAuth = whatsappWeb.LocalAuth
    QRCode = require('qrcode')
    axios = require('axios')
  } catch (error) {
    console.warn('WhatsApp Web.js não disponível:', error.message)
  }
}

// Simulação básica do adminDB para desenvolvimento
const adminDB = {
  collection: (name) => ({
    doc: (id) => ({
      update: async (data) => {
        console.log(`Simulando update no ${name}/${id}:`, data)
      }
    }),
    add: async (data) => {
      console.log(`Simulando add no ${name}:`, data)
    }
  }),
  FieldValue: {
    increment: (value) => ({ _increment: value })
  }
}

class WhatsAppManager {
  constructor() {
    this.sessions = new Map()
    this.io = null
    this.openai = null
    this.isServerSide = typeof window === 'undefined'
  }

  setSocketIO(io) {
    this.io = io
    console.log('Socket.IO configurado no WhatsApp Manager')
  }

  async createSession(sessionId, sessionName) {
    if (!this.isServerSide || !Client) {
      throw new Error('WhatsApp Manager só funciona no servidor')
    }

    if (this.sessions.has(sessionId)) {
      throw new Error('Sessão já existe')
    }

    const session = {
      id: sessionId,
      name: sessionName,
      client: null,
      status: 'disconnected',
      aiEnabled: false
    }

    this.sessions.set(sessionId, session)
    await this.updateSessionInDB(sessionId, { status: 'disconnected' })
    console.log(`Sessão ${sessionId} criada`)
  }

  async startSession(sessionId) {
    if (!this.isServerSide || !Client) {
      throw new Error('WhatsApp Manager só funciona no servidor')
    }

    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Sessão não encontrada')
    }

    if (session.client) {
      await this.stopSession(sessionId)
    }

    try {
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
          if (QRCode) {
            const qrCodeDataURL = await QRCode.toDataURL(qr)
            if (this.io) {
              this.io.emit('qr-code', { sessionId, qr: qrCodeDataURL })
            }
            console.log(`QR Code gerado para sessão ${sessionId}`)
          }
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
        if (this.io) {
          this.io.emit('session-status', { sessionId, status: 'connected' })
        }
      })

      client.on('authenticated', () => {
        console.log(`Cliente autenticado para sessão ${sessionId}`)
      })

      client.on('auth_failure', async (msg) => {
        console.error(`Falha na autenticação para sessão ${sessionId}:`, msg)
        session.status = 'error'
        await this.updateSessionInDB(sessionId, { status: 'error' })
        if (this.io) {
          this.io.emit('session-status', { sessionId, status: 'error' })
        }
      })

      client.on('disconnected', async (reason) => {
        console.log(`Cliente desconectado para sessão ${sessionId}:`, reason)
        session.status = 'disconnected'
        await this.updateSessionInDB(sessionId, { status: 'disconnected' })
        if (this.io) {
          this.io.emit('session-status', { sessionId, status: 'disconnected' })
        }
      })

      client.on('message', async (message) => {
        await this.handleIncomingMessage(sessionId, message)
      })

      // Inicializar cliente
      await client.initialize()
      
    } catch (error) {
      console.error(`Erro ao inicializar cliente para sessão ${sessionId}:`, error)
      session.status = 'error'
      await this.updateSessionInDB(sessionId, { status: 'error' })
      if (this.io) {
        this.io.emit('session-status', { sessionId, status: 'error' })
      }
      throw error
    }
  }

  async stopSession(sessionId) {
    const session = this.sessions.get(sessionId)
    if (!session || !session.client) {
      return
    }

    try {
      await session.client.destroy()
      session.client = null
      session.status = 'disconnected'
      await this.updateSessionInDB(sessionId, { status: 'disconnected' })
      if (this.io) {
        this.io.emit('session-status', { sessionId, status: 'disconnected' })
      }
      console.log(`Sessão ${sessionId} parada`)
    } catch (error) {
      console.error(`Erro ao parar sessão ${sessionId}:`, error)
    }
  }

  async handleIncomingMessage(sessionId, message) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      // Salvar mensagem no banco (simulado)
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

      console.log(`Mensagem recebida na sessão ${sessionId}: ${message.body}`)

      // Enviar para N8N se configurado
      if (session.n8nWebhook && axios) {
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

    } catch (error) {
      console.error(`Erro ao processar mensagem para sessão ${sessionId}:`, error)
    }
  }

  async sendMessage(sessionId, to, message) {
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

  async updateAISettings(sessionId, aiEnabled, n8nWebhook, aiConfig) {
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

  async updateSessionInDB(sessionId, data) {
    try {
      await adminDB.collection('whatsapp_sessions').doc(sessionId).update(data)
    } catch (error) {
      console.error(`Erro ao atualizar sessão ${sessionId} no banco:`, error)
    }
  }

  async saveMessage(sessionId, messageData) {
    try {
      await adminDB.collection('whatsapp_messages').add({
        sessionId,
        ...messageData
      })
    } catch (error) {
      console.error(`Erro ao salvar mensagem para sessão ${sessionId}:`, error)
    }
  }

  async sendToN8N(webhookUrl, data) {
    try {
      if (axios) {
        await axios.post(webhookUrl, data, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        })
        console.log('Dados enviados para N8N com sucesso')
      }
    } catch (error) {
      console.error('Erro ao enviar para N8N:', error)
    }
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId)
  }

  getAllSessions() {
    return Array.from(this.sessions.values())
  }
}

const whatsappManager = new WhatsAppManager()
module.exports = whatsappManager 