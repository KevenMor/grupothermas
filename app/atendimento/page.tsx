'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Chat, ChatMessage, ChatStatus, Reaction } from '@/lib/models'
import { Toaster, toast } from 'sonner'
import { ChatList } from './_components/ChatList'
import { ChatWindow } from './_components/ChatWindow'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AtendimentoPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background text-lg">Carregando...</div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [hasSelectedChatManually, setHasSelectedChatManually] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  
  // Estados para otimização
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string>('')
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesCache = useRef<Map<string, ChatMessage[]>>(new Map())

  // Função utilitária para normalizar conteúdo removendo prefixos como '*Nome:*'
  function normalizeContent(content: string) {
    if (!content) return '';
    // Remove prefixo *Nome:*
    return content.replace(/^\*[^*]+:\*\s*\n?/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // Função para buscar chats com cache
  const fetchChats = async (showLoader = true) => {
    if (showLoader) setIsLoadingChats(true)

    try {
      const response = await fetch('/api/atendimento/chats')
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data: Chat[] = await response.json()
      
      // Atualizar apenas se houver mudanças
      setChats(prevChats => {
        if (JSON.stringify(prevChats) === JSON.stringify(data)) {
          return prevChats // Não atualizar se não houve mudanças
        }
        return data
      })
      
      // Selecionar automaticamente apenas no primeiro carregamento absoluto
      if (data.length > 0 && selectedChat === null && chats.length === 0 && !hasSelectedChatManually) {
        setSelectedChat(data[0])
      }
      // Nunca sobrescrever selectedChat se hasSelectedChatManually for true
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar as conversas.')
    } finally {
      if (showLoader) setIsLoadingChats(false)
    }
  }

  // Função otimizada para buscar mensagens
  const fetchMessages = async (chatId: string, forceRefresh = false) => {
    // Usar cache se disponível e não for refresh forçado
    if (!forceRefresh && messagesCache.current.has(chatId)) {
      const cachedMessages = messagesCache.current.get(chatId)!
      setMessages(cachedMessages)
      return
    }

    setIsLoadingMessages(messages.length === 0)
    try {
      const response = await fetch(`/api/atendimento/messages?chatId=${chatId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data: ChatMessage[] = await response.json()
      
      // Manter mensagens com erro (failed) no array
      setMessages(prev => {
        const failed = prev.filter(m => m.status === 'failed')

        // Combinar dados do servidor com mensagens falhadas sem duplicar IDs
        const merged = [...data, ...failed]
        // Deduplicação aprimorada: remove temp-* se houver real com mesmo conteúdo, autor, tipo e timestamp próximo
        const result: ChatMessage[] = []
        for (const msg of merged) {
          // Normalizar conteúdo para comparação
          const normContent = normalizeContent(msg.content || '')
          // Se já existe uma real igual (conteúdo, autor, tipo e timestamp ~10s), não adiciona temp-*
          if (msg.id.startsWith('temp-')) {
            const hasReal = merged.some(m2 =>
              !m2.id.startsWith('temp-') &&
              normalizeContent(m2.content || '') === normContent &&
              ((m2.userName || m2.agentName || '').toLowerCase() === (msg.userName || msg.agentName || '').toLowerCase()) &&
              (m2.mediaType || 'text') === (msg.mediaType || 'text') &&
              Math.abs(new Date(m2.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
            )
            if (!hasReal && !result.find(m => m.id === msg.id)) result.push(msg)
          } else {
            // Remove qualquer temp-* duplicada
            const idx = result.findIndex(m =>
              m.id.startsWith('temp-') &&
              normalizeContent(m.content || '') === normContent &&
              ((m.userName || m.agentName || '').toLowerCase() === (msg.userName || msg.agentName || '').toLowerCase()) &&
              (m.mediaType || 'text') === (msg.mediaType || 'text') &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
            )
            if (idx !== -1) result.splice(idx, 1)
            if (!result.find(m => m.id === msg.id)) result.push(msg)
          }
        }
        const sorted = result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        messagesCache.current.set(chatId, sorted)
        return sorted
      })
      
      // Atualizar timestamp da última mensagem
      if (data.length > 0) {
        const lastMsg = data[data.length - 1]
        setLastMessageTimestamp(lastMsg.timestamp)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar mensagens.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Função para buscar apenas mensagens novas (otimizada)
  const fetchNewMessages = async (chatId: string) => {
    if (!lastMessageTimestamp) return
    
    try {
      const response = await fetch(`/api/atendimento/messages?chatId=${chatId}&since=${lastMessageTimestamp}`)
      if (!response.ok) return
      
      const newMessages: ChatMessage[] = await response.json()
      if (newMessages.length > 0) {
        setMessages(prev => {
          const combined = [...prev, ...newMessages]
          const result: ChatMessage[] = []
          for (const msg of combined) {
            const normContent = normalizeContent(msg.content || '')
            if (msg.id.startsWith('temp-')) {
              const hasReal = combined.some(m2 =>
                !m2.id.startsWith('temp-') &&
                normalizeContent(m2.content || '') === normContent &&
                ((m2.userName || m2.agentName || '').toLowerCase() === (msg.userName || msg.agentName || '').toLowerCase()) &&
                (m2.mediaType || 'text') === (msg.mediaType || 'text') &&
                Math.abs(new Date(m2.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
              )
              if (!hasReal && !result.find(m => m.id === msg.id)) result.push(msg)
            } else {
              const idx = result.findIndex(m =>
                m.id.startsWith('temp-') &&
                normalizeContent(m.content || '') === normContent &&
                ((m.userName || m.agentName || '').toLowerCase() === (msg.userName || msg.agentName || '').toLowerCase()) &&
                (m.mediaType || 'text') === (msg.mediaType || 'text') &&
                Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
              )
              if (idx !== -1) result.splice(idx, 1)
              if (!result.find(m => m.id === msg.id)) result.push(msg)
            }
          }
          const sorted = result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          messagesCache.current.set(chatId, sorted)
          return sorted
        })
        
        // Atualizar timestamp
        const lastMsg = newMessages[newMessages.length - 1]
        setLastMessageTimestamp(lastMsg.timestamp)
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens novas:', error)
    }
  }

  // Iniciar polling automático
  const startPolling = () => {
    if (isPolling) return
    setIsPolling(true)
    pollingIntervalRef.current = setInterval(() => {
      fetchChats(false)
      if (selectedChat) {
        fetchNewMessages(selectedChat.id)
      }
    }, 5000) // Polling a cada 5s (ajustável)
  }

  // Parar polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPolling(false)
  }

  // Buscar chats ao montar e iniciar polling
  useEffect(() => {
    fetchChats()
    startPolling()
    
    return () => stopPolling()
  }, [])

  // Buscar mensagens ao selecionar chat
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id, true)
      setLastMessageTimestamp('')
    }
    // Não depende de chats, só do selectedChat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat])

  // Escutar eventos de novas mensagens de mídia
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const newMessage = event.detail
      setMessages(prev => {
        const combined = [...prev, newMessage]
        const result: ChatMessage[] = []
        for (const msg of combined) {
          const normContent = normalizeContent(msg.content || '')
          if (msg.id.startsWith('temp-')) {
            const hasReal = combined.some(m2 =>
              !m2.id.startsWith('temp-') &&
              normalizeContent(m2.content || '') === normContent &&
              ((m2.userName || m2.agentName || '').toLowerCase() === (msg.userName || msg.agentName || '').toLowerCase()) &&
              (m2.mediaType || 'text') === (msg.mediaType || 'text') &&
              Math.abs(new Date(m2.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
            )
            if (!hasReal && !result.find(m => m.id === msg.id)) result.push(msg)
          } else {
            const idx = result.findIndex(m =>
              m.id.startsWith('temp-') &&
              normalizeContent(m.content || '') === normContent &&
              ((m.userName || m.agentName || '').toLowerCase() === (msg.userName || msg.agentName || '').toLowerCase()) &&
              (m.mediaType || 'text') === (msg.mediaType || 'text') &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
            )
            if (idx !== -1) result.splice(idx, 1)
            if (!result.find(m => m.id === msg.id)) result.push(msg)
          }
        }
        const sorted = result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        if (selectedChat) {
          messagesCache.current.set(selectedChat.id, sorted)
        }
        return sorted
      })
      
      // Atualizar cache
      if (selectedChat) {
        const currentCache = messagesCache.current.get(selectedChat.id) || []
        messagesCache.current.set(selectedChat.id, [...currentCache, newMessage])
      }
    }

    window.addEventListener('newMessage', handleNewMessage as EventListener)
    return () => window.removeEventListener('newMessage', handleNewMessage as EventListener)
  }, [selectedChat])

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat)
    setHasSelectedChatManually(true)
    
    // Buscar foto de perfil do WhatsApp automaticamente
    try {
      const avatarResponse = await fetch(`/api/zapi/avatar?phone=${chat.customerPhone}`)
      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json()
        if (avatarData.avatarUrl) {
          // Atualizar o avatar no estado local
          setChats(prevChats => 
            prevChats.map(c => 
              c.id === chat.id 
                ? { ...c, customerAvatar: avatarData.avatarUrl }
                : c
            )
          )
          
          // Atualizar no backend também
          await fetch(`/api/atendimento/chats/${chat.customerPhone}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerAvatar: avatarData.avatarUrl })
          })
        }
      }
    } catch (error) {
      console.error('Erro ao buscar avatar:', error)
    }
    
    // Marcar mensagens como lidas se houver mensagens não lidas
    if (chat.unreadCount > 0) {
      try {
        await fetch(`/api/atendimento/chats/${chat.customerPhone}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAsRead: true })
        })
        
        // Atualizar o estado local para refletir a mudança imediatamente
        setChats(prevChats => 
          prevChats.map(c => 
            c.id === chat.id 
              ? { ...c, unreadCount: 0 }
              : c
          )
        )
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error)
      }
    }
    
    // Buscar mensagens do chat selecionado
    fetchMessages(chat.id)
  }

  const handleSendMessage = async (data: { content: string, replyTo?: { id: string, text: string, author: 'agent' | 'customer' } }) => {
    if (!selectedChat) return
    const tempId = `temp-${Date.now()}`
    const currentUserName = 'Keven Moreira' // Temporário
    const currentUserId = 'user-001' // Temporário

    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: data.content,
      role: 'agent',
      timestamp: new Date().toISOString(),
      status: 'sending',
      userName: currentUserName,
      agentId: currentUserId,
      agentName: currentUserName,
      ...(data.replyTo ? { replyTo: data.replyTo } : {})
    }
    setMessages(prev => {
      const combined = [...prev, optimisticMessage]
      const result: ChatMessage[] = []
      for (const msg of combined) {
        if (msg.id.startsWith('temp-')) {
          const hasReal = combined.some(m2 =>
            !m2.id.startsWith('temp-') &&
            m2.content === msg.content &&
            Math.abs(new Date(m2.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
          )
          if (!hasReal && !result.find(m => m.id === msg.id)) result.push(msg)
        } else {
          const idx = result.findIndex(m =>
            m.id.startsWith('temp-') &&
            m.content === msg.content &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
          )
          if (idx !== -1) result.splice(idx, 1)
          if (!result.find(m => m.id === msg.id)) result.push(msg)
        }
      }
      const sorted = result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      messagesCache.current.set(selectedChat.id, sorted)
      return sorted
    })
    try {
      const response = await fetch('/api/atendimento/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: data.content,
          phone: selectedChat.customerPhone,
          userName: currentUserName,
          agentId: currentUserId,
          ...(data.replyTo ? { replyTo: data.replyTo } : {})
        }),
      })

      const responseJson = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(responseJson.error || 'Falha ao enviar mensagem')
      }

      const sentMessage: ChatMessage = responseJson
      setMessages(prev =>
        [
          ...prev.filter(msg => msg.id !== tempId),
          { ...(sentMessage as ChatMessage), status: (sentMessage.status as ChatStatus) || 'sent' }
        ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      )
      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: sentMessage.content, timestamp: sentMessage.timestamp }
          : chat
      ))
    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao enviar mensagem: ${error.message || ''}`)
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg))
    }
  }

  // Funções para controle de IA
  const handleToggleAI = async (chatId: string, enabled: boolean) => {
    try {
      const action = enabled ? 'return_to_ai' : 'pause_ai'
      const response = await fetch('/api/atendimento/ai-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          action,
          agentId: 'current-agent' // TODO: Pegar do contexto de autenticação
        }),
      })

      if (!response.ok) throw new Error('Falha ao atualizar IA')

      // Atualizar o chat local
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { 
              ...chat, 
              aiEnabled: enabled,
              aiPaused: !enabled,
              conversationStatus: enabled ? 'ai_active' : 'agent_assigned'
            }
          : chat
      ))

      // Atualizar selectedChat se for o mesmo
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? {
          ...prev,
          aiEnabled: enabled,
          aiPaused: !enabled,
          conversationStatus: enabled ? 'ai_active' : 'agent_assigned'
        } : null)
      }

      toast.success(enabled ? 'Conversa retornada para IA' : 'IA pausada com sucesso')
    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao ${enabled ? 'ativar' : 'pausar'} IA: ${error.message}`)
    }
  }

  const handleAssumeChat = async (chatId: string) => {
    try {
      const response = await fetch('/api/atendimento/ai-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          action: 'assume_chat',
          agentId: 'current-agent' // TODO: Pegar do contexto de autenticação
        }),
      })

      if (!response.ok) throw new Error('Falha ao assumir atendimento')

      // Atualizar o chat local
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { 
              ...chat, 
              aiPaused: true,
              conversationStatus: 'agent_assigned',
              assignedAgent: 'current-agent'
            }
          : chat
      ))

      // Atualizar selectedChat se for o mesmo
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? {
          ...prev,
          aiPaused: true,
          conversationStatus: 'agent_assigned',
          assignedAgent: 'current-agent'
        } : null)
      }

      toast.success('Atendimento assumido com sucesso!')
    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao assumir atendimento: ${error.message}`)
    }
  }

  const handleAssignAgent = async (chatId: string) => {
    try {
      const response = await fetch('/api/atendimento/ai-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          action: 'assign_agent',
          agentId: 'current-agent' // TODO: Pegar do contexto de autenticação
        }),
      })

      if (!response.ok) throw new Error('Falha ao assumir conversa')

      // Atualizar o chat local
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { 
              ...chat, 
              aiPaused: true,
              conversationStatus: 'agent_assigned',
              assignedAgent: 'current-agent'
            }
          : chat
      ))

      // Atualizar selectedChat se for o mesmo
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? {
          ...prev,
          aiPaused: true,
          conversationStatus: 'agent_assigned',
          assignedAgent: 'current-agent'
        } : null)
      }

      toast.success('Conversa assumida com sucesso')
    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao assumir conversa: ${error.message}`)
    }
  }

  const handleMarkResolved = async (chatId: string) => {
    try {
      const response = await fetch('/api/atendimento/ai-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          action: 'mark_resolved',
          agentId: 'current-agent' // TODO: Pegar do contexto de autenticação
        }),
      })

      if (!response.ok) throw new Error('Falha ao finalizar atendimento')

      // Atualizar o chat local
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { 
              ...chat, 
              conversationStatus: 'resolved',
              aiPaused: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'current-agent'
            }
          : chat
      ))

      // Atualizar selectedChat se for o mesmo
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? {
          ...prev,
          conversationStatus: 'resolved',
          aiPaused: true,
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'current-agent'
        } : null)
      }

      toast.success('Atendimento finalizado com sucesso!')
    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao finalizar atendimento: ${error.message}`)
    }
  }

  // Atualização de nome/foto do cliente em tempo real
  const handleCustomerUpdate = (data: Partial<Chat>) => {
    if (!selectedChat) return
    setChats(prev => prev.map(chat =>
      chat.id === selectedChat.id ? { ...chat, ...data } : chat
    ))
    setSelectedChat(prev => prev ? { ...prev, ...data } : null)
  }

  // Função para responder a uma mensagem
  const handleReplyMessage = (message: ChatMessage) => {
    // Implementar lógica para mostrar preview da resposta
    console.log('Respondendo à mensagem:', message)
    // TODO: Implementar preview de resposta no MessageInput
  }

  // Função para editar uma mensagem
  const handleEditMessage = (message: ChatMessage) => {
    console.log('Editando mensagem:', message)
    // TODO: Implementar edição inline
  }

  // Função para excluir uma mensagem
  const handleDeleteMessage = (messageId: string) => {
    console.log('Excluindo mensagem:', messageId)
    // Atualizar mensagens localmente
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  // Função para mostrar informações da mensagem
  const handleMessageInfo = (message: ChatMessage) => {
    console.log('Informações da mensagem:', message)
    // TODO: Implementar modal com informações detalhadas
  }

  // Função para adicionar/remover reações
  const handleReaction = (messageId: string, emoji: string) => {
    console.log('Reação adicionada:', messageId, emoji)
    // Atualizar mensagens localmente
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const newReaction: Reaction = {
          emoji: emoji,
          by: 'Atendente',
          fromMe: true,
          timestamp: new Date().toISOString(),
          agentId: 'current-user-id'
        }
        return {
          ...msg,
          reactions: [...(msg.reactions || []), newReaction]
        }
      }
      return msg
    }))
  }

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      <div className="flex w-full h-full overflow-hidden">
        <div className="flex w-full h-full overflow-hidden bg-white dark:bg-gray-900">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            isLoading={isLoadingChats}
          />
          <div className="flex-1 flex flex-col min-w-0">
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingMessages && messages.length === 0}
                onToggleAI={handleToggleAI}
                onAssumeChat={handleAssumeChat}
                onAssignAgent={handleAssignAgent}
                onMarkResolved={handleMarkResolved}
                onReplyMessage={handleReplyMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onMessageInfo={handleMessageInfo}
                onReaction={handleReaction}
                onCustomerUpdate={handleCustomerUpdate}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-gray-500">
                Selecione um chat para começar o atendimento.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 