import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
import { isSameDay, isToday, isYesterday, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import lamejs from 'lamejs'
import { 
  convertAudioToMultipleFormats, 
  isFFmpegSupported, 
  validateAudioBlob 
} from '@/lib/audioConverter'
import useSWR from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/components/auth/AuthProvider'

interface ChatWindowProps {
  chat: Chat | null
  messages: ChatMessage[]
  onSendMessage: (data: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' }, agentName?: string, userName?: string }) => void
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState(chat.customerName)
  const [showNameEditModal, setShowNameEditModal] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'ai_active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'agent_assigned': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'resolved': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Aguardando'
      case 'ai_active': return 'IA Ativa'
      case 'agent_assigned': return 'Atendente'
      case 'resolved': return 'Resolvido'
      default: return 'Desconhecido'
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

  const handleNameSave = async () => {
    if (!editingName.trim()) {
      alert('Nome não pode estar vazio')
      return
    }

    try {
      if (onCustomerUpdate) {
        await onCustomerUpdate({ customerName: editingName.trim() })
      }
      setShowNameEditModal(false)
      setIsEditingName(false)
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      alert('Erro ao atualizar nome do cliente')
    }
  }

  const handleAvatarClick = () => {
    // Implementar upload de avatar se necessário
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Implementar upload de avatar
      console.log('Upload de avatar:', file)
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
    }
  }

  return (
    <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="w-14 h-14">
          <AvatarImage src={chat.customerAvatar} alt={chat.customerName} />
          <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
            {chat.customerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chat.customerName}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingName(chat.customerName)
                setShowNameEditModal(true)
              }}
              className="text-gray-500 hover:text-blue-600 p-1 h-auto"
              title="Editar nome do cliente"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {chat.customerPhone}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Ticket: <span className="font-bold text-blue-700 dark:text-blue-300">#{chat.id?.slice(-6) || '----'}</span></span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Tempo: <span className="font-semibold">{formatTimeAgo(chat.timestamp) || '--'}</span></span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${getStatusColor(chat.conversationStatus || 'waiting')}`}>{getStatusText(chat.conversationStatus || 'waiting')}</span>
            {chat.status === 'closed' && <span className="text-xs text-orange-500 font-medium">Fechado</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {renderControls()}
      </div>

      {/* Modal para editar nome do cliente */}
      <Dialog open={showNameEditModal} onOpenChange={setShowNameEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Nome do Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Cliente
              </label>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Digite o nome do cliente"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave()
                  }
                }}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleNameSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Salvar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNameEditModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const MessageInput = ({ 
  chat,
  onSendMessage, 
  onAssumeChat,
  replyToMessage,
  textareaRef,
  onClearReply
}: { 
  chat: Chat | null
  onSendMessage: (data: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' }, agentName?: string, userName?: string }) => void
  onAssumeChat?: () => void
  replyToMessage?: ChatMessage | null
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onClearReply?: () => void
}) => {
  const { user } = useAuth();
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
    if (!chat || !message.trim()) return;
    const messageWithLineBreaks = message.trim();
    const agentName = user?.displayName || user?.name || user?.email || 'Atendente';
    const messageData: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' }, agentName?: string, userName?: string } = {
      content: messageWithLineBreaks,
      agentName,
      userName: agentName
    };
    if (replyToMessage) {
      messageData.replyTo = {
        id: replyToMessage.id,
        text: replyToMessage.content,
        author: replyToMessage.role === 'user' ? 'customer' : 'agent'
      };
    }
    onSendMessage(messageData);
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
    // Só permite interação quando o agente assumiu o atendimento
    // Quando está com IA ativa, o agente precisa assumir primeiro
    return chat?.conversationStatus === 'agent_assigned'
  }

  const handleAttachment = (type: string) => {
    console.log('📎 handleAttachment chamada:', { type, canInteract: canInteract(), chatId: chat?.id })
    
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
        input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'
        break
    }
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      console.log('📁 Arquivo selecionado:', { name: file.name, size: file.size, type: file.type })

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
      // Filtrar campos undefined antes de enviar
      const logData: any = {
        level,
        category,
        message,
        details
      }
      
      // Adicionar phone apenas se não for undefined
      if (chat?.customerPhone) {
        logData.phone = chat.customerPhone
      }
      
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      })
    } catch (error) {
      console.warn('Erro ao enviar log (não crítico):', error)
      // Não falhar o fluxo principal por erro de log
    }
  }

  // 2. Ajustar toggleRecording para usar formato detectado
  const toggleRecording = async () => {
    console.log('🎤 toggleRecording chamada:', {
      canInteract: canInteract(),
      isRecording,
      chatId: chat?.id
    })
    
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
    if (!chat) return
    try {
      console.log('🎵 Iniciando envio de áudio:', {
        blobSize: audioBlob.size,
        mimeType,
        phone: chat.customerPhone
      })
      if (!isFFmpegSupported()) {
        // Fallback: upload do webm/opus para microserviço externo
        console.warn('FFmpeg não suportado, usando microserviço externo para conversão backend.')
        const formData = new FormData()
        formData.append('file', audioBlob, `audio_${Date.now()}.webm`)
        let backendMp3Url = ''
        try {
          const panelConfigResponse = await fetch('/api/admin/config')
          const panelConfig = await panelConfigResponse.json()
          const audioConverterUrl = panelConfig?.audioConverterUrl || 'https://audio.grupothermas.com.br/convert-audio'
          console.log('🔄 Enviando para conversão:', audioConverterUrl)
          console.log('Arquivo enviado:', {
            name: `audio_${Date.now()}.webm`,
            size: audioBlob.size,
            type: mimeType
          })
          const uploadResponse = await fetch(audioConverterUrl, { method: 'POST', body: formData })
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            backendMp3Url = uploadResult.url
            console.log('✅ Upload e conversão via microserviço concluídos:', backendMp3Url)
            await sendLog('info', 'media', 'Upload/conversão via microserviço concluídos', { url: backendMp3Url })
          } else {
            const errorText = await uploadResponse.text()
            console.error('❌ Falha no upload/conversão via microserviço:', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              url: audioConverterUrl,
              errorText
            })
            await sendLog('error', 'media', 'Falha no upload/conversão via microserviço', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              url: audioConverterUrl,
              errorText
            })
            alert(`Erro ao converter áudio no microserviço:\nStatus: ${uploadResponse.status} ${uploadResponse.statusText}\nURL: ${audioConverterUrl}\nErro: ${errorText}`)
            return
          }
        } catch (error) {
          console.error('❌ Erro no upload/conversão via microserviço:', error)
          await sendLog('error', 'media', 'Erro no upload/conversão via microserviço', { error: error instanceof Error ? error.message : error })
          alert('Erro ao converter áudio no microserviço. Detalhes no console.')
          return
        }
        
        // Enviar áudio via API de mídia
        if (backendMp3Url && chat) {
          console.log('📤 Enviando áudio convertido via API:', backendMp3Url)
          
          const mediaResponse = await fetch('/api/atendimento/send-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: chat.customerPhone,
              type: 'audio',
              localPath: backendMp3Url,
              mp3Url: backendMp3Url,
              filename: `audio_${Date.now()}.mp3`
            })
          })
          
          if (mediaResponse.ok) {
            const mediaResult = await mediaResponse.json()
            console.log('✅ Áudio enviado com sucesso:', mediaResult)
            
            // Criar mensagem otimista
            const optimisticMessage: ChatMessage = {
              id: `temp-audio-${Date.now()}`,
              content: '🎵 Áudio',
              role: 'agent',
              timestamp: new Date().toISOString(),
              status: 'sent',
              userName: 'Você',
              agentId: 'current-agent',
              agentName: 'Você',
              mediaType: 'audio',
              mediaUrl: backendMp3Url,
              mediaInfo: {
                type: 'audio',
                url: backendMp3Url,
                filename: `audio_${Date.now()}.mp3`
              }
            }
            
            // Adicionar mensagem à lista imediatamente
            window.dispatchEvent(new CustomEvent('newMessage', { detail: optimisticMessage }))
            
          } else {
            const errorResult = await mediaResponse.json()
            console.error('❌ Erro ao enviar áudio:', errorResult)
            alert(`Erro ao enviar áudio: ${errorResult.error || 'Erro desconhecido'}`)
          }
        }
        return
      }
      
      // ...restante do fluxo de envio de áudio usando ffmpeg.wasm...
      console.log('⚠️ FFmpeg não suportado, usando microserviço externo')
      
    } catch (error) {
      console.error('❌ Erro geral no envio de áudio:', error)
      alert('Erro ao enviar áudio. Detalhes no console.')
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
                Para interagir com este chat, você precisa assumir o atendimento primeiro. A IA será desativada automaticamente.
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
            {/* Preview de resposta */}
            {replyToMessage && (
              <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Respondendo a {replyToMessage.role === 'user' ? 'cliente' : 'agente'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 truncate">
                      {replyToMessage.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearReply}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onInput={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
              }}
              placeholder={canInteract() ? "Digite uma mensagem... (Enter para enviar, Shift+Enter para nova linha)" : "Assuma o atendimento para enviar mensagens"}
              disabled={!canInteract()}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim()) {
                    handleSend();
                  }
                }
                // Shift+Enter permite nova linha (comportamento padrão)
              }}
              rows={1}
              className="block w-full resize-none pr-10 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none min-h-[40px] max-h-40 shadow-inner text-base transition-all whitespace-pre-wrap"
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

// Função para formatar tempo decorrido
const formatTimeAgo = (timestamp: string) => {
  if (!timestamp) return '--'
  
  const now = new Date()
  const messageTime = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Agora'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
  return `${Math.floor(diffInMinutes / 1440)}d`
}

// Função utilitária para formatar datas como em ChatMessageItem
const formatDate = (date: Date) => {
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

export function ChatWindow(props: ChatWindowProps) {
  if (!props.chat) console.warn('[ChatWindow] chat está undefined!', props)
  if (!props.messages) console.error('[ChatWindow] messages está undefined!', props)
  if (!props.onSendMessage) console.error('[ChatWindow] onSendMessage está undefined!', props)
  if (typeof props.isLoading === 'undefined') console.warn('[ChatWindow] isLoading está undefined!', props)
  console.debug('[ChatWindow] props:', props)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Verificar suporte ao FFmpeg
  useEffect(() => {
    async function checkFFmpeg() {
      try {
        const { isFFmpegSupported } = await import('@/lib/audioConverter')
        const supported = await isFFmpegSupported()
        console.log('FFmpeg suportado:', supported)
      } catch (error) {
        console.warn('FFmpeg não disponível:', error)
      }
    }
    checkFFmpeg()
  }, [])

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
  }, [props.messages])

  // Sempre rolar para o final ao receber nova mensagem
  useEffect(() => {
    scrollToBottom()
  }, [props.messages.length])

  if (!props.chat) {
    return <WelcomeScreen />
  }

  // Agrupar mensagens por data usando useMemo para otimização
  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: Date; messages: ChatMessage[] }> = []
    let currentGroup: { date: Date; messages: ChatMessage[] } | null = null

    props.messages.forEach((msg) => {
      const dateObj = new Date(msg.timestamp)
      const isFirstOfDay = !currentGroup || !isSameDay(currentGroup.date, dateObj)
      
      if (isFirstOfDay) {
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = { date: dateObj, messages: [msg] }
      } else {
        currentGroup!.messages.push(msg)
      }
    })

    if (currentGroup) {
      groups.push(currentGroup)
    }

    return groups
  }, [props.messages])

  // Memoizar funções de callback para evitar re-renderizações
  const handleAssumeChat = useCallback(() => {
    if (props.chat && props.onAssumeChat) {
      props.onAssumeChat(props.chat.id)
    }
  }, [props.chat, props.onAssumeChat])

  const handleReplyMessage = useCallback((message: ChatMessage) => {
    setReplyToMessage(message)
    // Focar no input após definir resposta
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [])

  const handleSend = useCallback((data: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' }, agentName?: string, userName?: string }) => {
    if (!props.chat) return
    props.onSendMessage(data)
    // Limpar mensagem de resposta após enviar
    setReplyToMessage(null)
  }, [props.chat, props.onSendMessage])

  const handleEditMessage = useCallback(async (message: ChatMessage) => {
    if (!props.chat) return
    
    const newContent = prompt('Editar mensagem:', message.content)
    if (!newContent || newContent === message.content) return

    try {
      const response = await fetch('/api/atendimento/message-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          chatId: props.chat.id,
          messageId: message.id,
          content: newContent
        })
      })

      if (response.ok) {
        if (props.onEditMessage) props.onEditMessage(message)
      }
    } catch (error) {
      console.error('Erro ao editar mensagem:', error)
    }
  }, [props.chat, props.onEditMessage])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!props.chat) return
    
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return

    try {
      const response = await fetch('/api/atendimento/message-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          chatId: props.chat.id,
          messageId
        })
      })

      if (response.ok) {
        if (props.onDeleteMessage) props.onDeleteMessage(messageId)
      }
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error)
    }
  }, [props.chat, props.onDeleteMessage])

  const handleMessageInfo = useCallback(async (message: ChatMessage) => {
    if (!props.chat) return

    try {
      const response = await fetch('/api/atendimento/message-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'info',
          chatId: props.chat.id,
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
  }, [props.chat])

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!props.chat) return

    // Buscar a mensagem pelo id
    const message = props.messages?.find(m => m.id === messageId)
    const zapiMessageId = message?.zapiMessageId || messageId

    try {
      const response = await fetch('/api/atendimento/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          phone: props.chat.id,
          messageId: zapiMessageId,
          emoji: emoji,
          agentName: 'Atendente',
          agentId: 'current-user-id'
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('Reação enviada com sucesso:', result)
        // Atualizar mensagens localmente se necessário
        if (props.onReaction) {
          props.onReaction(messageId, emoji)
        }
      } else {
        console.error('Erro ao enviar reação:', result)
        alert(`Erro ao enviar reação: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao enviar reação:', error)
      alert('Erro ao enviar reação. Tente novamente.')
    }
  }, [props.chat, props.onReaction, props.messages])

  return (
    <div className="relative h-full flex flex-col">
      <ChatHeader 
        chat={props.chat} 
        onToggleAI={props.onToggleAI} 
        onAssignAgent={props.onAssignAgent} 
        onMarkResolved={props.onMarkResolved}
        onAssumeChat={props.onAssumeChat}
        onCustomerUpdate={props.onCustomerUpdate}
      />
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollBehavior: 'smooth' }}>
        {props.isLoading && props.messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Separador de data */}
                <div className="flex justify-center my-6">
                  <div className="bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-gray-200 text-xs px-4 py-1 rounded-full shadow-sm font-semibold">
                    {formatDate(group.date)}
                  </div>
                </div>
                
                {/* Mensagens do grupo */}
                {group.messages.map((msg) => {
                  const isAgent = msg.role === 'agent'
                  return (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      avatarUrl={!isAgent ? props.chat?.customerAvatar : undefined}
                      contactName={!isAgent ? props.chat?.customerName : undefined}
                      showAvatar={true}
                      showName={true}
                      isFirstOfDay={false} // Já agrupamos por data
                      onReply={handleReplyMessage}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                      onInfo={handleMessageInfo}
                      onReaction={handleReaction}
                      messages={props.messages}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput 
        chat={props.chat}
        onSendMessage={handleSend}
        onAssumeChat={() => props.onAssumeChat?.(props.chat?.id || '')}
        replyToMessage={replyToMessage}
        textareaRef={textareaRef}
        onClearReply={() => setReplyToMessage(null)}
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
