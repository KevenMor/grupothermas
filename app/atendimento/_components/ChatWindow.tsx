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
  }, [chat.customerName, chat.customerAvatar])

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

  const [replyDraft, setReplyDraft] = useState<{ id: string, text: string, author: 'agent' | 'customer' } | null>(null)

  const handleSend = () => {
    if (!chat) return;
    if (replyDraft) {
      onSendMessage({
        ...{ content: message },
        replyTo: replyDraft
      });
    } else {
      onSendMessage({ content: message });
    }
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
          
          // Parar timer
          if (recordingInterval) {
            clearInterval(recordingInterval)
            setRecordingInterval(null)
          }
          setRecordingTime(0)
          
          // Limpar stream
          stream.getTracks().forEach(track => track.stop())
          
          // Enviar automaticamente sem confirmação
          await sendAudioDirectly(audioBlob)
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

  // Função utilitária para converter WAV para MP3
  async function wavToMp3(wavBlob: Blob): Promise<Blob> {
    try {
      console.log('Iniciando conversão WAV->MP3...');
      console.log('Blob size:', wavBlob.size);
      console.log('Blob type:', wavBlob.type);
      
      const arrayBuffer = await wavBlob.arrayBuffer();
      console.log('ArrayBuffer size:', arrayBuffer.byteLength);
      
      // Verificar se o arquivo tem tamanho mínimo para ser um WAV válido
      if (arrayBuffer.byteLength < 44) {
        throw new Error('Arquivo muito pequeno para ser um WAV válido');
      }
      
      const dataView = new DataView(arrayBuffer);
      
      // Verificar se é realmente um arquivo WAV
      const riffHeader = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1), 
        dataView.getUint8(2),
        dataView.getUint8(3)
      );
      
      if (riffHeader !== 'RIFF') {
        console.warn('Arquivo não é um WAV válido, enviando como MP3 direto');
        // Se não é WAV, retornar como MP3 (assumindo que já foi convertido)
        return new Blob([arrayBuffer], { type: 'audio/mp3' });
      }
      
      console.log('Header RIFF encontrado, processando WAV...');
      
      const wav = lamejs.WavHeader.readHeader(dataView);
      console.log('WAV Header:', wav);
      
      if (!wav || !wav.dataOffset || !wav.dataLen) {
        throw new Error('Header WAV inválido');
      }
      
      const samples = new Int16Array(arrayBuffer, wav.dataOffset, wav.dataLen / 2);
      console.log('Samples extraídos:', samples.length);
      
      const mp3enc = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, 128);
      const mp3Data = [];
      let remaining = samples.length;
      let samplesPerFrame = 1152;
      
      for (let i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
        let mono = samples.subarray(i, i + samplesPerFrame);
        let mp3buf = mp3enc.encodeBuffer(mono);
        if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
        remaining -= samplesPerFrame;
      }
      
      let mp3buf = mp3enc.flush();
      if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
      
      console.log('Conversão MP3 concluída, chunks:', mp3Data.length);
      return new Blob(mp3Data, { type: 'audio/mp3' });
      
    } catch (error) {
      console.error('Erro na conversão WAV->MP3:', error);
      console.log('Fallback: enviando arquivo original como MP3');
      
      // Fallback: se a conversão falhar, enviar o arquivo original como MP3
      const arrayBuffer = await wavBlob.arrayBuffer();
      return new Blob([arrayBuffer], { type: 'audio/mp3' });
    }
  }

  // Função para enviar áudio diretamente (sem confirmação)
  const sendAudioDirectly = async (audioBlob: Blob) => {
    if (!audioBlob || !chat) return
    
    console.log('=== INICIANDO ENVIO DE ÁUDIO ===')
    console.log('Chat:', chat.customerPhone)
    console.log('Audio Blob Size:', audioBlob.size)
    
    try {
      // Converter WAV para MP3 antes do upload
      console.log('1. Convertendo WAV para MP3...')
      const mp3Blob = await wavToMp3(audioBlob)
      console.log('MP3 convertido. Tamanho:', mp3Blob.size)
      
      // Upload do áudio
      console.log('2. Fazendo upload para Firebase...')
      const formData = new FormData()
      formData.append('file', mp3Blob, `audio_${Date.now()}.mp3`)
      formData.append('type', 'audio')
      
      const uploadResponse = await fetch('/api/atendimento/upload', {
        method: 'POST',
        body: formData
      })
      
      console.log('Upload Response Status:', uploadResponse.status)
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Erro no upload:', errorText)
        throw new Error(`Erro no upload do áudio: ${errorText}`)
      }
      
      const uploadResult = await uploadResponse.json()
      console.log('3. Upload concluído:', uploadResult)
      
      // Enviar áudio via Z-API usando nova API local
      console.log('4. Enviando via Z-API...')
      const mediaPayload = {
          phone: chat.customerPhone,
          type: 'audio',
          localPath: uploadResult.fileUrl
      }
      console.log('Payload para Z-API:', mediaPayload)
      
      const mediaResponse = await fetch('/api/atendimento/send-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaPayload)
      })
      
      console.log('Z-API Response Status:', mediaResponse.status)
      
      if (mediaResponse.ok) {
        const mediaResult = await mediaResponse.json()
        console.log('5. Áudio enviado com sucesso via Z-API:', mediaResult)
        
        console.log('6. Áudio enviado com sucesso! Aguardando confirmação via webhook...')
        
      } else {
        const errorText = await mediaResponse.text()
        console.error('Erro ao enviar via Z-API:', errorText)
        throw new Error(`Falha ao enviar áudio via Z-API: ${errorText}`)
      }
    } catch (error) {
      console.error('=== ERRO NO ENVIO DE ÁUDIO ===')
      console.error('Error:', error)
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
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
  onCustomerUpdate
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [replyDraft, setReplyDraft] = useState<{ id: string, text: string, author: 'agent' | 'customer' } | null>(null)
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
    setReplyDraft({
      id: message.id,
      text: message.content,
      author: message.role === 'agent' ? 'agent' : 'customer'
    })
  }

  // Função para cancelar reply
  const handleCancelReply = () => {
    setReplyDraft(null)
  }

  // Função para enviar mensagem (adaptar para incluir reply)
  const handleSend = (data: { content: string }) => {
    if (!chat) return
    if (replyDraft) {
      onSendMessage({
        ...data,
        replyTo: replyDraft
      })
      setReplyDraft(null)
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
        onCustomerUpdate={onCustomerUpdate}
      />
      <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto bg-[url('/chat-bg.png')] dark:bg-[url('/chat-bg-dark.png')] relative">
        {/* Botão para ir para o fim */}
        {!autoScroll && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setAutoScroll(true);
            }}
            className="fixed lg:absolute right-6 bottom-28 lg:bottom-8 z-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-3 flex items-center justify-center transition-all border-4 border-white/80 dark:border-gray-900/80 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)' }}
            aria-label="Ir para a última mensagem"
          >
            <ArrowDown className="w-6 h-6" />
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
      
      {replyDraft && (
        <div className="flex items-center bg-blue-100 border-l-4 border-blue-500 px-3 py-2 mb-2 rounded relative">
          <div className="flex-1">
            <div className="text-xs text-blue-700 font-semibold">Respondendo a:</div>
            <div className="text-xs text-blue-900 truncate max-w-xs">{replyDraft.text}</div>
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
