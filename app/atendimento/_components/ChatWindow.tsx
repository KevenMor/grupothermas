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
  X
} from 'lucide-react'
import { ChatMessageItem } from './ChatMessageItem'
import { EmojiPicker } from './EmojiPicker'
import { isSameDay } from 'date-fns'

interface ChatWindowProps {
  chat: Chat | null
  messages: ChatMessage[]
  onSendMessage: (data: { content: string, replyTo?: string, replyToContent?: string }) => void
  isLoading: boolean
  onToggleAI?: (chatId: string, enabled: boolean) => void
  onAssignAgent?: (chatId: string) => void
  onMarkResolved?: (chatId: string) => void
  onAssumeChat?: (chatId: string) => void
  onReplyMessage?: (message: ChatMessage) => void
  onEditMessage?: (message: ChatMessage) => void
  onDeleteMessage?: (messageId: string) => void
  onMessageInfo?: (message: ChatMessage) => void
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
  onAssumeChat 
}: { 
  chat: Chat
  onToggleAI?: (chatId: string, enabled: boolean) => void
  onAssignAgent?: (chatId: string) => void
  onMarkResolved?: (chatId: string) => void
  onAssumeChat?: (chatId: string) => void
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

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={chat.customerAvatar} />
          <AvatarFallback>{chat.customerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{chat.customerName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{chat.customerPhone}</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${getStatusColor(chat.conversationStatus || 'waiting')}`}>
              {getStatusText(chat.conversationStatus || 'waiting')}
            </p>
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
        
        {/* Controles originais */}
        <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Phone className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Video className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Search className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><MoreVertical className="w-5 h-5" /></Button>
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
  onSendMessage: (data: { content: string, replyTo?: string, replyToContent?: string }) => void
  onAssumeChat?: () => void
}) => {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [showSendConfirmation, setShowSendConfirmation] = useState(false)
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
      alert('Erro ao enviar arquivo. Tente novamente.')
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

  const toggleRecording = async () => {
    if (!canInteract()) return

    if (!isRecording) {
      // Iniciar gravação
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        const chunks: Blob[] = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' })
          setRecordedAudio(audioBlob)
          setShowSendConfirmation(true)
          
          // Parar timer
          if (recordingInterval) {
            clearInterval(recordingInterval)
            setRecordingInterval(null)
          }
          setRecordingTime(0)
          
          // Limpar stream
          stream.getTracks().forEach(track => track.stop())
        }

        setMediaRecorder(recorder)
        setAudioChunks(chunks)
        recorder.start()
        setIsRecording(true)
        
        // Iniciar timer
        const interval = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        setRecordingInterval(interval)

      } catch (error) {
        console.error('Erro ao acessar microfone:', error)
        alert('Erro ao acessar microfone. Verifique as permissões.')
      }
    } else {
      // Parar gravação
      if (mediaRecorder) {
        mediaRecorder.stop()
        setIsRecording(false)
        setMediaRecorder(null)
      }
    }
  }

  // Função para confirmar envio do áudio
  const confirmSendAudio = async () => {
    if (!recordedAudio || !chat) return
    
    try {
      // Upload do áudio
      const formData = new FormData()
      formData.append('file', recordedAudio, `audio_${Date.now()}.wav`)
      formData.append('type', 'audio')
      
      const uploadResponse = await fetch('/api/atendimento/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Erro no upload do áudio')
      }
      
      const uploadResult = await uploadResponse.json()
      
      // Enviar áudio via Z-API usando nova API local
      const mediaResponse = await fetch('/api/atendimento/send-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: chat.customerPhone,
          type: 'audio',
          localPath: uploadResult.fileUrl
        })
      })
      
      if (mediaResponse.ok) {
        const mediaResult = await mediaResponse.json()
        console.log('Áudio enviado com sucesso:', mediaResult)
        
        // Criar mensagem otimista para mostrar imediatamente
        const optimisticMessage: ChatMessage = {
          id: `temp-audio-${Date.now()}`,
          content: '[ÁUDIO] Mensagem de voz',
          role: 'agent',
          timestamp: new Date().toISOString(),
          status: 'sent',
          userName: 'Você',
          agentId: 'current-agent',
          agentName: 'Você',
          mediaType: 'audio',
          mediaUrl: uploadResult.fileUrl,
          mediaInfo: {
            type: 'audio',
            url: uploadResult.fileUrl,
            filename: `audio_${Date.now()}.wav`
          }
        }
        
        // Adicionar mensagem à lista imediatamente
        window.dispatchEvent(new CustomEvent('newMessage', { detail: optimisticMessage }))
        
        setShowSendConfirmation(false)
        setRecordedAudio(null)
        console.log('Áudio adicionado à conversa sem reload')
      } else {
        throw new Error('Falha ao enviar áudio via Z-API')
      }
      
    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      alert('Erro ao enviar áudio. Tente novamente.')
    }
  }

  // Função para cancelar envio do áudio
  const cancelSendAudio = () => {
    setShowSendConfirmation(false)
    setRecordedAudio(null)
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
        {/* Indicador de gravação */}
        {isRecording && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 dark:text-red-300 font-medium">Gravando áudio</span>
                <span className="text-red-600 dark:text-red-400 font-mono">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <Button 
                onClick={toggleRecording}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Parar
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
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={canInteract() ? "Digite uma mensagem..." : "Assuma o atendimento para enviar mensagens"}
              disabled={!canInteract()}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="pr-10"
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

      {/* Modal de Confirmação de Áudio */}
      {showSendConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Áudio gravado</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Deseja enviar este áudio?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelSendAudio}>
                Cancelar
              </Button>
              <Button onClick={confirmSendAudio} className="bg-blue-600 hover:bg-blue-700 text-white">
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
  onMessageInfo
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null)
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    setAutoScroll(isAtBottom);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    // Só fazer scroll se autoScroll estiver ativo E houver novas mensagens
    if (autoScroll && messages.length > lastMessageCount) {
      const timeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timeout);
    }
    setLastMessageCount(messages.length);
  }, [messages.length, autoScroll, lastMessageCount]);

  // Adicionar log de depuração das mensagens
  console.log('Mensagens recebidas:', messages);

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
    setReplyMessage(message)
  }

  // Função para cancelar reply
  const handleCancelReply = () => {
    setReplyMessage(null)
  }

  // Função para enviar mensagem (adaptar para incluir reply)
  const handleSend = (data: { content: string, replyTo?: string, replyToContent?: string }) => {
    if (!chat) return
    if (replyMessage) {
      onSendMessage({
        ...data,
        replyTo: replyMessage.id,
        replyToContent: replyMessage.content
      })
      setReplyMessage(null)
    } else {
      onSendMessage(data)
    }
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

  // Agrupar mensagens por data
  let lastDate: Date | null = null

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-gray-900">
      <ChatHeader 
        chat={chat} 
        onToggleAI={onToggleAI} 
        onAssignAgent={onAssignAgent} 
        onMarkResolved={onMarkResolved}
        onAssumeChat={handleAssumeChat}
      />
      <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto bg-[url('/chat-bg.png')] dark:bg-[url('/chat-bg-dark.png')] relative">
        {/* Botão para ir para o fim */}
        {!autoScroll && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setAutoScroll(true);
            }}
            className="absolute right-4 bottom-24 z-10 bg-blue-500 text-white px-3 py-1 rounded shadow hover:bg-blue-600 transition"
          >
            Ir para a última mensagem
          </button>
        )}
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
                  messages={messages}
                />
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {replyMessage && (
        <div className="flex items-center bg-blue-100 border-l-4 border-blue-500 px-3 py-2 mb-2 rounded relative">
          <div className="flex-1">
            <div className="text-xs text-blue-700 font-semibold">Respondendo a:</div>
            <div className="text-xs text-blue-900 truncate max-w-xs">{replyMessage.content}</div>
          </div>
          <Button size="icon" variant="ghost" className="ml-2" onClick={handleCancelReply}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <MessageInput
        chat={chat}
        onSendMessage={handleSend}
        onAssumeChat={handleAssumeChat}
      />
    </div>
  )
} 
