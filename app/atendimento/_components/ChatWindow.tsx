import { useState, useRef, useEffect, useCallback } from 'react'
import { Chat, ChatMessage } from '@/lib/models'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MoreVertical, 
  Search, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  Loader2,
  Phone,
  Video,
  Bot,
  BotOff,
  User,
  CheckCircle,
  Pause,
  Play,
  Image,
  FileText,
  Camera,
  Reply,
  Edit,
  Trash2,
  Info,
  X,
  Square,
  ArrowDown
} from 'lucide-react'
import { ChatMessageItem } from './ChatMessageItem'
import { EmojiPicker } from './EmojiPicker'
import { isSameDay } from 'date-fns'
import lamejs from 'lamejs'
import { 
  convertAudioToMultipleFormats, 
  isFFmpegSupported, 
  validateAudioBlob 
} from '@/lib/audioConverter'

interface ChatWindowProps {
  chat: Chat | null
  messages: ChatMessage[]
  onSendMessage: (data: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' } }) => void
  isLoading: boolean
  onToggleAI?: (chatId: string, enabled: boolean) => void
  onAssignAgent?: (chatId: string) => void
  onMarkResolved?: (chatId: string) => void
  onAssumeChat?: (chatId: string) => void
  onReplyMessage?: (message: ChatMessage) => void
  onEditMessage?: (message: ChatMessage) => void
  onDeleteMessage?: (messageId: string) => void
  onMessageInfo?: (message: ChatMessage) => void
  onReaction?: (messageId: string, emoji: string) => void
  onCustomerUpdate?: (data: Partial<Chat>) => void
}

const WelcomeScreen = () => (
  <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 bg-gray-100 dark:bg-gray-800/50 p-8">
     <div className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72.23c-1.054.067-1.98-.778-1.98-1.842v-4.286c0-.97.616-1.812 1.5-2.097L16.5 8.42a1.5 1.5 0 011.085.092l2.665 1.5c.599.336 1.155.234 1.5.099z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72.23c-1.054.067-1.98-.778-1.98-1.842V10.6c0-.97.616-1.812 1.5-2.097L3.75 8.42a1.5 1.5 0 011.085.092l2.665 1.5c.599.336 1.155.234 1.5.099z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-1.538.096c-1.054.067-1.98-.778-1.98-1.842V10.6c0-.97.616-1.812 1.5-2.097l.193-.06a1.5 1.5 0 011.085.092l1.048.591a1.5 1.5 0 001.5.099z" />
        </svg>
      </div>
    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Selecione um chat</h2>
    <p>Comece a conversar com seus clientes.</p>
  </div>
);

const ChatHeader = ({ 
  chat, 
  onToggleAI, 
  onAssignAgent, 
  onMarkResolved,
  onAssumeChat,
  onCustomerUpdate
}: { 
  chat: Chat
  onToggleAI?: (chatId: string, enabled: boolean) => void
  onAssignAgent?: (chatId: string) => void
  onMarkResolved?: (chatId: string) => void
  onAssumeChat?: (chatId: string) => void
  onCustomerUpdate?: (data: Partial<Chat>) => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-500'
      case 'ai_active': return 'text-blue-500'
      case 'agent_assigned': return 'text-green-500'
      case 'resolved': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Aguardando'
      case 'ai_active': return 'IA Ativa'
      case 'agent_assigned': return 'Em Atendimento'
      case 'resolved': return 'Resolvido'
      default: return 'Online'
    }
  }

  // Controles baseados no status da conversa
  const renderControls = () => {
    switch (chat.conversationStatus) {
      case 'waiting':
      case 'ai_active':
        // Conversa aguardando ou com IA - mostrar botão "Assumir Atendimento"
        return (
          <div className="flex items-center gap-1 mr-2 border-r border-gray-200 dark:border-gray-600 pr-2">
            <Button 
              onClick={() => onAssumeChat?.(chat.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <User className="w-4 h-4 mr-1" />
              Assumir Atendimento
            </Button>
          </div>
        )

      case 'agent_assigned':
        // Conversa assumida por agente - mostrar "Voltar para IA" e "Finalizar"
        return (
          <div className="flex items-center gap-1 mr-2 border-r border-gray-200 dark:border-gray-600 pr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onToggleAI?.(chat.id, true)}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Voltar para IA"
            >
              <Bot className="w-4 h-4 mr-1" />
              Voltar para IA
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onMarkResolved?.(chat.id)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              title="Finalizar Atendimento"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Finalizar
            </Button>
          </div>
        )

      case 'resolved':
        // Conversa resolvida - mostrar botão para reabrir
        return (
          <div className="flex items-center gap-1 mr-2 border-r border-gray-200 dark:border-gray-600 pr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onToggleAI?.(chat.id, true)}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Reabrir Conversa"
            >
              <Play className="w-4 h-4 mr-1" />
              Reabrir
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(chat.customerName)
  const [savingName, setSavingName] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [avatar, setAvatar] = useState(chat.customerAvatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(chat.customerName)
    setAvatar(chat.customerAvatar)
    // Buscar avatar do WhatsApp via Z-API se não houver ou for padrão
    const isDefaultAvatar = !chat.customerAvatar || chat.customerAvatar.includes('ui-avatars.com') || chat.customerAvatar.includes('default');
    if (isDefaultAvatar && chat.customerPhone) {
      fetch(`/api/zapi/avatar?phone=${encodeURIComponent(chat.customerPhone)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.avatarUrl && data.avatarUrl !== chat.customerAvatar) {
            setAvatar(data.avatarUrl);
            // Atualizar no backend
            fetch(`/api/atendimento/chats/${chat.customerPhone}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerAvatar: data.avatarUrl })
            });
            onCustomerUpdate?.({ customerAvatar: data.avatarUrl });
          }
        });
    }
  }, [chat.customerName, chat.customerAvatar, chat.customerPhone]);

  const handleNameSave = async () => {
    if (!name.trim() || name === chat.customerName) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      const res = await fetch(`/api/atendimento/chats/${chat.customerPhone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name })
      })
      if (res.ok) {
        setEditingName(false)
        onCustomerUpdate?.({ customerName: name })
      }
    } finally {
      setSavingName(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Upload para storage (pode ser Firebase Storage ou base64 temporário)
    const formData = new FormData()
    formData.append('file', file)
    // Supondo endpoint /api/atendimento/upload retorna { url }
    const res = await fetch('/api/atendimento/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.url) {
      setAvatar(data.url)
      await fetch(`/api/atendimento/chats/${chat.customerPhone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerAvatar: data.url })
      })
      onCustomerUpdate?.({ customerAvatar: data.url })
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="relative group">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <button
            className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-1 shadow group-hover:opacity-100 opacity-60 transition-opacity border border-gray-300 dark:border-gray-600"
            onClick={handleAvatarClick}
            title="Editar foto"
            type="button"
          >
            <Camera className="w-4 h-4 text-gray-600 dark:text-gray-200" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={e => { if (e.key === 'Enter') handleNameSave() }}
                className="h-7 text-sm px-2 py-1"
                autoFocus
                disabled={savingName}
              />
              <Button size="icon" variant="ghost" onClick={handleNameSave} disabled={savingName}>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{name}</h3>
              <button
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={() => setEditingName(true)}
                title="Editar nome"
                type="button"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">{chat.customerPhone}</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${getStatusColor(chat.conversationStatus || 'waiting')}`}>{getStatusText(chat.conversationStatus || 'waiting')}</p>
            {chat.conversationStatus === 'ai_active' && (
              <div title="IA Ativa"><Bot className="w-4 h-4 text-blue-500" /></div>
            )}
            {chat.conversationStatus === 'agent_assigned' && (
              <div title="Agente Atribuído"><User className="w-4 h-4 text-green-500" /></div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Controles dinâmicos baseados no status */}
        {renderControls()}
        
        {/* Menu de opções (desabilitado por enquanto) */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          disabled
          title="Opções em breve"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

const MessageInput = ({ 
  chat,
  onSendMessage, 
  onAssumeChat 
}: { 
  chat: Chat | null
  onSendMessage: (data: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' } }) => void
  onAssumeChat?: () => void
}) => {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)

  const [showLongMessageConfirmation, setShowLongMessageConfirmation] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  
  // Estados para preview de mídia
  const [showMediaPreview, setShowMediaPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewType, setPreviewType] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const handleSend = () => {
    if (!chat) return;
    onSendMessage({ content: message });
    setMessage('');
  }

  const confirmSendLongMessage = () => {
    onSendMessage({ content: pendingMessage })
    setMessage('')
    setPendingMessage('')
    setShowLongMessageConfirmation(false)
  }

  const cancelSendLongMessage = () => {
    setPendingMessage('')
    setShowLongMessageConfirmation(false)
  }

  const canInteract = () => {
    return chat?.conversationStatus === 'agent_assigned'
  }

  const handleAttachment = (type: string) => {
    if (!canInteract()) {
      alert('Você precisa assumir o atendimento para enviar arquivos.')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    
    // Definir tipos aceitos baseado no tipo
    switch (type) {
      case 'image':
      case 'camera':
        input.accept = 'image/*'
        if (type === 'camera') {
          input.setAttribute('capture', 'environment')
        }
        break
      case 'audio':
        input.accept = 'audio/*'
        break
      case 'video':
        input.accept = 'video/*'
        break
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt'
        break
    }
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Mostrar preview antes de enviar
      setPreviewFile(file)
      setPreviewType(type === 'camera' ? 'image' : type)
      
      // Criar URL para preview
      if (type === 'image' || type === 'camera') {
        setPreviewUrl(URL.createObjectURL(file))
      } else if (type === 'document') {
        setPreviewUrl('') // Para documentos, só mostramos o nome
      }
      
      setShowMediaPreview(true)
    }
    
    input.click()
  }

  // Função para confirmar envio da mídia
  const confirmSendMedia = async () => {
    if (!previewFile || !chat) return
    
    try {
      setShowMediaPreview(false)
      
      // Upload do arquivo
      const formData = new FormData()
      formData.append('file', previewFile)
      formData.append('type', previewType)
      
      const uploadResponse = await fetch('/api/atendimento/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Erro no upload')
      }
      
      const uploadResult = await uploadResponse.json()
      
      // Enviar via Z-API usando a nova API de mídia local
      const mediaResponse = await fetch('/api/atendimento/send-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: chat.customerPhone,
          type: previewType,
          localPath: uploadResult.fileUrl, // Caminho local do arquivo
          filename: previewFile.name
        })
      })
      
      if (mediaResponse.ok) {
        const mediaResult = await mediaResponse.json()
        console.log('Mídia enviada com sucesso:', mediaResult)
        
        // Criar mensagem otimista para mostrar imediatamente
        const optimisticMessage: ChatMessage = {
          id: `temp-media-${Date.now()}`,
          content: `[${previewType.toUpperCase()}] ${previewFile.name}`,
          role: 'agent',
          timestamp: new Date().toISOString(),
          status: 'sent',
          userName: 'Você',
          agentId: 'current-agent',
          agentName: 'Você',
          mediaType: previewType as 'image' | 'audio' | 'video' | 'document',
          mediaUrl: uploadResult.fileUrl,
          mediaInfo: {
            type: previewType,
            url: uploadResult.fileUrl,
            filename: previewFile.name
          }
        }
        
        // Adicionar mensagem à lista imediatamente
        window.dispatchEvent(new CustomEvent('newMessage', { detail: optimisticMessage }))
        
        // Limpar preview
        setPreviewFile(null)
        setPreviewType('')
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl('')
        }
        
        // Não recarregar a página - a mensagem já foi adicionada
        console.log('Mídia adicionada à conversa sem reload')
      } else {
        const errorResult = await mediaResponse.json()
        throw new Error(errorResult.error || 'Erro ao enviar mídia')
      }
      
    } catch (error) {
      console.error('Erro ao enviar anexo:', error)
      
      // Mostrar erro mais específico
      let errorMessage = 'Erro ao enviar arquivo. Tente novamente.'
      
      if (error instanceof Error) {
        if (error.message.includes('upload')) {
          errorMessage = 'Erro no upload do arquivo. Verifique se o arquivo não está corrompido.'
        } else if (error.message.includes('Z-API')) {
          errorMessage = 'Erro na API do WhatsApp. Tente novamente em alguns instantes.'
        } else if (error.message.includes('404')) {
          errorMessage = 'Arquivo não encontrado no servidor. Tente fazer upload novamente.'
        } else {
          errorMessage = `Erro: ${error.message}`
        }
      }
      
      alert(errorMessage)
    }
  }

  // Função para cancelar envio da mídia
  const cancelSendMedia = () => {
    setShowMediaPreview(false)
    setPreviewFile(null)
    setPreviewType('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  // 1. Detectar suporte a formatos de áudio de forma robusta
  const getSupportedAudioFormat = () => {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav'
    ]
    
    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        console.log(`Formato de áudio suportado: ${format}`)
        return format
      }
    }
    
    console.warn('Nenhum formato de áudio suportado pelo navegador')
    return null
  }

  // Função para enviar logs para o sistema
  const sendLog = async (level: 'info' | 'warn' | 'error' | 'debug', category: 'audio' | 'media' | 'webhook' | 'zapi' | 'openai' | 'system', message: string, details?: any) => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          category,
          message,
          details,
          phone: chat?.customerPhone,
          messageId: details?.messageId
        })
      })
    } catch (error) {
      console.error('Erro ao enviar log:', error)
    }
  }

  // 2. Ajustar toggleRecording para usar formato detectado
  const toggleRecording = async () => {
    if (!canInteract()) return

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = getSupportedAudioFormat()
        
        if (!mimeType) {
          const errorMsg = 'Seu navegador não suporta gravação de áudio. Tente usar Chrome, Edge ou Firefox.'
          await sendLog('error', 'audio', errorMsg, {
            userAgent: navigator.userAgent,
            supportedFormats: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/wav'].map(f => ({
              format: f,
              supported: MediaRecorder.isTypeSupported(f)
            }))
          })
          alert(errorMsg)
          return
        }
        
        await sendLog('info', 'audio', 'Iniciando gravação de áudio', {
          mimeType,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
        
        const recorder = new MediaRecorder(stream, { mimeType })
        const chunks: Blob[] = []
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: mimeType })
          if (recordingInterval) {
            clearInterval(recordingInterval)
            setRecordingInterval(null)
          }
          setRecordingTime(0)
          stream.getTracks().forEach(track => track.stop())
          
          await sendLog('info', 'audio', 'Gravação finalizada', {
            blobSize: audioBlob.size,
            mimeType,
            duration: recordingTime,
            timestamp: new Date().toISOString()
          })
          
          await sendAudioDirectly(audioBlob, mimeType)
        }
        
        setMediaRecorder(recorder)
        setAudioChunks(chunks)
        recorder.start()
        setIsRecording(true)
        
        const interval = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        setRecordingInterval(interval)
      } catch (error) {
        console.error('Erro ao acessar microfone:', error)
        
        const errorDetails = {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorName: error instanceof Error ? error.name : 'Unknown',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
        
        await sendLog('error', 'audio', 'Erro ao acessar microfone', errorDetails)
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            alert('Permissão de microfone negada. Por favor, permita o acesso ao microfone e tente novamente.')
          } else if (error.name === 'NotFoundError') {
            alert('Nenhum microfone encontrado. Verifique se há um dispositivo de áudio conectado.')
          } else {
            alert(`Erro ao acessar microfone: ${error.message}`)
          }
        } else {
          alert('Erro desconhecido ao acessar microfone. Verifique as permissões.')
        }
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop()
        setIsRecording(false)
        setMediaRecorder(null)
      }
    }
  }

  // 3. Ajustar sendAudioDirectly para lidar com diferentes formatos
  const sendAudioDirectly = async (audioBlob: Blob, mimeType: string) => {
    if (!audioBlob || !chat) return
    
    console.log('=== INICIANDO ENVIO DE ÁUDIO ===')
    console.log('Formato original:', mimeType)
    console.log('Tamanho do blob:', audioBlob.size)
    
    await sendLog('info', 'audio', 'Iniciando envio de áudio', {
      mimeType,
      blobSize: audioBlob.size,
      phone: chat.customerPhone,
      timestamp: new Date().toISOString()
    })
    
    try {
      let oggBlob: Blob | null = null
      let mp3Blob: Blob | null = null
      
      // Verificar se o FFmpeg é suportado
      if (!isFFmpegSupported()) {
        const errorMsg = 'Conversão de áudio indisponível: FFmpeg não suportado neste navegador. Envio de áudio abortado.';
        console.error(errorMsg);
        await sendLog('error', 'audio', errorMsg, { userAgent: navigator.userAgent });
        alert(errorMsg);
        return;
      } else {
        // Usar conversão real com FFmpeg
        console.log('🔄 Usando conversão real com FFmpeg...')
        try {
          const convertedFormats = await convertAudioToMultipleFormats(audioBlob)
          mp3Blob = convertedFormats.mp3Blob
          oggBlob = convertedFormats.oggBlob
          console.log('✅ Conversão FFmpeg concluída:', {
            mp3Success: !!mp3Blob,
            oggSuccess: !!oggBlob,
            mp3Size: mp3Blob?.size,
            oggSize: oggBlob?.size
          })
          await sendLog('info', 'audio', 'Conversão FFmpeg concluída', {
            mp3Success: !!mp3Blob,
            oggSuccess: !!oggBlob,
            mp3Size: mp3Blob?.size,
            oggSize: oggBlob?.size
          })
        } catch (ffmpegError) {
          const errorMsg = 'Erro na conversão de áudio com FFmpeg. Envio de áudio abortado.';
          console.error('❌', errorMsg, ffmpegError);
          await sendLog('error', 'audio', errorMsg, { error: ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error' });
          alert(errorMsg + '\n' + (ffmpegError instanceof Error ? ffmpegError.message : ''));
          return;
        }
      }

      // Validar blobs convertidos
      if (!mp3Blob && !oggBlob) {
        const errorMsg = 'Nenhum formato de áudio foi convertido com sucesso. Envio abortado.';
        console.error(errorMsg);
        await sendLog('error', 'audio', errorMsg, {});
        alert(errorMsg);
        return;
      }
      
      // Upload dos formatos disponíveis
      let oggUrl = ''
      let mp3Url = ''
      
      if (oggBlob) {
        const formData = new FormData()
        formData.append('file', oggBlob, `audio_${Date.now()}.ogg`)
        formData.append('type', 'audio')
        
        try {
          console.log('📤 Fazendo upload OGG...')
          const uploadResponse = await fetch('/api/atendimento/upload', { 
            method: 'POST', 
            body: formData 
          })
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            oggUrl = uploadResult.fileUrl
            console.log('✅ Upload OGG concluído:', oggUrl)
            await sendLog('info', 'media', 'Upload OGG concluído', { 
              url: oggUrl,
              size: oggBlob.size,
              type: oggBlob.type
            })
          } else {
            const errorText = await uploadResponse.text()
            console.warn('❌ Falha no upload OGG:', errorText)
            await sendLog('warn', 'media', 'Falha no upload OGG', { error: errorText })
          }
        } catch (error) {
          console.error('❌ Erro no upload OGG:', error)
          await sendLog('error', 'media', 'Erro no upload OGG', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }
      
      if (mp3Blob) {
        const formData = new FormData()
        formData.append('file', mp3Blob, `audio_${Date.now()}.mp3`)
        formData.append('type', 'audio')
        
        try {
          console.log('📤 Fazendo upload MP3...')
          const uploadResponse = await fetch('/api/atendimento/upload', { 
            method: 'POST', 
            body: formData 
          })
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            mp3Url = uploadResult.fileUrl
            console.log('✅ Upload MP3 concluído:', mp3Url)
            await sendLog('info', 'media', 'Upload MP3 concluído', { 
              url: mp3Url,
              size: mp3Blob.size,
              type: mp3Blob.type
            })
          } else {
            const errorText = await uploadResponse.text()
            console.error('❌ Falha no upload MP3:', errorText)
            await sendLog('error', 'media', 'Falha no upload MP3', { error: errorText })
            throw new Error('Falha no upload do áudio')
          }
        } catch (error) {
          console.error('❌ Erro no upload MP3:', error)
          await sendLog('error', 'media', 'Erro no upload MP3', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          throw error
        }
      }
      
      if (!mp3Url && !oggUrl) {
        throw new Error('Nenhum formato de áudio foi enviado com sucesso')
      }
      
      // Enviar para o backend
      const mediaPayload: any = {
        phone: chat.customerPhone,
        type: 'audio',
        localPath: oggUrl || mp3Url // Priorizar OGG se disponível
      }
      if (oggUrl) mediaPayload.oggUrl = oggUrl
      if (mp3Url) mediaPayload.mp3Url = mp3Url
      
      console.log('📤 Enviando áudio via Z-API...')
      console.log('Payload:', mediaPayload)
      
      const mediaResponse = await fetch('/api/atendimento/send-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaPayload)
      })
      
      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text()
        console.error('❌ Erro ao enviar via Z-API:', errorText)
        await sendLog('error', 'zapi', 'Erro ao enviar áudio via Z-API', { 
          error: errorText,
          phone: chat.customerPhone,
          payload: mediaPayload
        })
        throw new Error(`Falha ao enviar áudio via Z-API: ${errorText}`)
      }
      
      const mediaResult = await mediaResponse.json()
      console.log('✅ Áudio enviado com sucesso!', mediaResult)
      await sendLog('info', 'zapi', 'Áudio enviado com sucesso', {
        phone: chat.customerPhone,
        oggUrl,
        mp3Url,
        messageId: mediaResult.messageId
      })
      
    } catch (error) {
      console.error('=== ERRO NO ENVIO DE ÁUDIO ===')
      console.error('Error:', error)
      
      await sendLog('error', 'audio', 'Erro no envio de áudio', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phone: chat.customerPhone,
        mimeType,
        blobSize: audioBlob.size
      })
      
      alert(`Erro ao enviar áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Função para formatar tempo de gravação
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!chat) {
    return null
  }

  return (
    <>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Interface de gravação estilo WhatsApp */}
        {isRecording && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              
              {/* Visualizador de onda sonora fixo */}
              <div className="flex-1 flex items-center gap-1 px-4">
                {[12, 8, 16, 20, 14, 10, 18, 22, 16, 12, 14, 8, 20, 16, 10, 18, 14, 12, 16, 8].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
              
              <Button 
                onClick={toggleRecording}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4"
              >
                <Square className="w-4 h-4 mr-1" />
                Enviar
              </Button>
            </div>
          </div>
        )}

        {!canInteract() && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Para interagir com este chat, você precisa assumir o atendimento.
              </p>
              <Button 
                onClick={onAssumeChat}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Assumir Atendimento
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleAttachment('image')}
              disabled={!canInteract()}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Enviar imagem"
            >
              <Image className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleAttachment('camera')}
              disabled={!canInteract()}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Tirar foto"
            >
              <Camera className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleAttachment('document')}
              disabled={!canInteract()}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Enviar documento"
            >
              <FileText className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={e => {
                setMessage(e.target.value)
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
              }}
              placeholder={canInteract() ? "Digite uma mensagem..." : "Assuma o atendimento para enviar mensagens"}
              disabled={!canInteract()}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                // Shift+Enter permite nova linha
              }}
              rows={1}
              className="block w-full resize-none pr-10 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none min-h-[40px] max-h-40 shadow-inner text-base transition-all"
              style={{ lineHeight: '1.5', overflow: 'auto' }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!canInteract()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Smile className="w-5 h-5" />
            </Button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker 
                  onEmojiSelect={(emoji) => {
                    setMessage(prev => prev + emoji)
                    setShowEmojiPicker(false)
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              disabled={!canInteract()}
              className={`${isRecording ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 dark:text-gray-400'} hover:text-gray-700 dark:hover:text-gray-200`}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Button
              onClick={handleSend}
              disabled={!message.trim() || !canInteract()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 dark:disabled:bg-gray-600"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Preview de Mídia */}
      {showMediaPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar envio</h3>
            
            {previewType === 'image' && previewUrl && (
              <div className="mb-4">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                />
              </div>
            )}
            
            {previewType === 'document' && previewFile && (
              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="font-medium">{previewFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Deseja enviar este {previewType === 'image' ? 'imagem' : 'documento'}?
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelSendMedia}>
                Cancelar
              </Button>
              <Button onClick={confirmSendMedia} className="bg-blue-600 hover:bg-blue-700 text-white">
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Mensagem Longa */}
      {showLongMessageConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Mensagem longa</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sua mensagem tem mais de 100 caracteres. Deseja enviar mesmo assim?
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-6 max-h-32 overflow-y-auto">
              <p className="text-sm">{pendingMessage}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelSendLongMessage}>
                Cancelar
              </Button>
              <Button onClick={confirmSendLongMessage} className="bg-blue-600 hover:bg-blue-700 text-white">
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function ChatWindow({ 
  chat, 
  messages, 
  onSendMessage, 
  isLoading, 
  onToggleAI, 
  onAssignAgent, 
  onMarkResolved,
  onAssumeChat,
  onReplyMessage,
  onEditMessage,
  onDeleteMessage,
  onMessageInfo,
  onReaction,
  onCustomerUpdate
}: ChatWindowProps) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  // Função para rolar até o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Detectar se está no final do chat
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40
    setShowScrollToBottom(!atBottom)
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll)
    // Checar inicialmente
    handleScroll()
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [messages])

  // Sempre rolar para o final ao receber nova mensagem
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  if (!chat) {
    return <WelcomeScreen />
  }

  const handleAssumeChat = () => {
    if (chat && onAssumeChat) {
      onAssumeChat(chat.id)
    }
  }

  // Função para iniciar reply
  const handleReplyMessage = (message: ChatMessage) => {
    if (onReplyMessage) {
      onReplyMessage(message)
    }
  }

  // Função para enviar mensagem (adaptar para incluir reply)
  const handleSend = (data: { content: string }) => {
    if (!chat) return
    onSendMessage(data)
  }

  // Implementar funções das mensagens
  const handleEditMessage = async (message: ChatMessage) => {
    if (!chat) return
    
    const newContent = prompt('Editar mensagem:', message.content)
    if (!newContent || newContent === message.content) return

    try {
      const response = await fetch('/api/atendimento/message-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          chatId: chat.id,
          messageId: message.id,
          content: newContent
        })
      })

      if (response.ok) {
        if (onEditMessage) onEditMessage(message)
      }
    } catch (error) {
      console.error('Erro ao editar mensagem:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!chat) return
    
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return

    try {
      const response = await fetch('/api/atendimento/message-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          chatId: chat.id,
          messageId
        })
      })

      if (response.ok) {
        if (onDeleteMessage) onDeleteMessage(messageId)
      }
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error)
    }
  }

  const handleMessageInfo = async (message: ChatMessage) => {
    if (!chat) return

    try {
      const response = await fetch('/api/atendimento/message-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'info',
          chatId: chat.id,
          messageId: message.id
        })
      })

      if (response.ok) {
        const info = await response.json()
        alert(`Informações da Mensagem:
ID: ${info.id}
Conteúdo: ${info.content}
Enviado em: ${new Date(info.timestamp).toLocaleString('pt-BR')}
Tipo: ${info.role === 'agent' ? 'Agente' : info.role === 'ai' ? 'IA' : 'Cliente'}
Status: ${info.status}
${info.edited ? `Editado em: ${new Date(info.editedAt).toLocaleString('pt-BR')}` : ''}
${info.agentName ? `Agente: ${info.agentName}` : ''}`)
      }
    } catch (error) {
      console.error('Erro ao buscar informações da mensagem:', error)
    }
  }

  // Função para enviar reação
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!chat) return

    try {
      const response = await fetch('/api/atendimento/send-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: chat.id,
          messageId: messageId,
          emoji: emoji,
          agentName: 'Atendente', // Pode ser dinâmico baseado no usuário logado
          agentId: 'current-user-id' // Pode ser dinâmico baseado no usuário logado
        })
      })

      if (response.ok) {
        console.log('Reação enviada com sucesso')
      } else {
        const error = await response.json()
        console.error('Erro ao enviar reação:', error)
        alert(`Erro ao enviar reação: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao enviar reação:', error)
      alert('Erro ao enviar reação. Tente novamente.')
    }
  }

  // Agrupar mensagens por data
  let lastDate: Date | null = null

  return (
    <div className="relative h-full flex flex-col">
      <ChatHeader 
        chat={chat} 
        onToggleAI={onToggleAI} 
        onAssignAgent={onAssignAgent} 
        onMarkResolved={onMarkResolved}
        onAssumeChat={handleAssumeChat}
        onCustomerUpdate={onCustomerUpdate}
      />
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollBehavior: 'smooth' }}>
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, idx) => {
              const dateObj = new Date(msg.timestamp)
              const isFirstOfDay = !lastDate || !isSameDay(lastDate, dateObj)
              lastDate = dateObj
              const isAgent = msg.role === 'agent'
              return (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  avatarUrl={!isAgent ? chat.customerAvatar : undefined}
                  contactName={!isAgent ? chat.customerName : undefined}
                  showAvatar={true}
                  showName={true}
                  isFirstOfDay={isFirstOfDay}
                  onReply={handleReplyMessage}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onInfo={handleMessageInfo}
                  onReaction={handleReaction}
                  messages={messages}
                />
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        chat={chat}
        onSendMessage={handleSend}
        onAssumeChat={handleAssumeChat}
      />

      {/* Botão flutuante de seta para baixo */}
      {showScrollToBottom && (
        <button
          className="fixed bottom-24 right-8 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-2 transition-all border-2 border-white/80"
          onClick={scrollToBottom}
          aria-label="Ir para a última mensagem"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      )}
    </div>
  )
} 
