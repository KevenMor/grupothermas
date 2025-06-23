import { useState, useRef, useEffect } from 'react'
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
  Info
} from 'lucide-react'
import { ChatMessageItem } from './ChatMessageItem'
import { isSameDay } from 'date-fns'

interface ChatWindowProps {
  chat: Chat | null
  messages: ChatMessage[]
  onSendMessage: (content: string) => void
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
  onSendMessage: (content: string) => void
  onAssumeChat?: () => void
}) => {
  const [message, setMessage] = useState('')
  const [showAttachments, setShowAttachments] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleAttachment = (type: string) => {
    setShowAttachments(false)
    // TODO: Implementar envio de anexos
    console.log('Anexo tipo:', type)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: Implementar gravação de áudio
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Menu de anexos */}
      {showAttachments && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-3 max-w-xs">
            <button
              onClick={() => handleAttachment('image')}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                <Image className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Imagem</span>
            </button>
            
            <button
              onClick={() => handleAttachment('camera')}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Câmera</span>
            </button>
            
            <button
              onClick={() => handleAttachment('document')}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Documento</span>
            </button>
            
            <button
              onClick={() => handleAttachment('contact')}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-2">
                <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Contato</span>
            </button>
          </div>
        </div>
      )}

      {/* Input de mensagem */}
      <div className="p-3">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={() => setShowAttachments(!showAttachments)}
            title="Anexos"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Input
            type="text"
            placeholder="Digite uma mensagem..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-grow bg-transparent border-none focus:ring-0 h-10 px-2 text-gray-900 dark:text-gray-100"
          />
          
          {message.trim() ? (
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10"
              title="Enviar mensagem"
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full w-10 h-10 ${isRecording ? 'bg-red-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              onClick={toggleRecording}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!chat) {
    return <WelcomeScreen />
  }

  const handleAssumeChat = () => {
    if (chat && onAssumeChat) {
      onAssumeChat(chat.id)
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
      <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-[url('/chat-bg.png')] dark:bg-[url('/chat-bg-dark.png')]">
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
                  onReply={onReplyMessage}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  onInfo={onMessageInfo}
                />
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        chat={chat}
        onSendMessage={onSendMessage}
        onAssumeChat={handleAssumeChat}
      />
    </div>
  )
} 
