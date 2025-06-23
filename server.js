const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // Configurar Socket.IO com WhatsApp Manager
  let whatsappManager = null
  try {
    whatsappManager = require('./lib/whatsappManager')
    whatsappManager.setSocketIO(io)
    console.log('WhatsApp Manager inicializado com sucesso')
  } catch (error) {
    console.warn('WhatsApp Manager não pôde ser carregado:', error.message)
    console.log('Servidor funcionará sem funcionalidades WhatsApp')
  }

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id)
    })

    // Eventos personalizados podem ser adicionados aqui
    socket.on('join-session', (sessionId) => {
      socket.join(`session-${sessionId}`)
      console.log(`Cliente ${socket.id} entrou na sessão ${sessionId}`)
    })

    socket.on('leave-session', (sessionId) => {
      socket.leave(`session-${sessionId}`)
      console.log(`Cliente ${socket.id} saiu da sessão ${sessionId}`)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.IO server running')
    })
}) 