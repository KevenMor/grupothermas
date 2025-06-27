'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Chat, ChatMessage, ChatStatus } from '@/lib/models'
import { Toaster, toast } from 'sonner'
import { ChatList } from './_components/ChatList'
import { ChatWindow } from './_components/ChatWindow'

export default function AtendimentoPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Função para buscar chats
  const fetchChats = async () => {
    // Exibe loader somente se ainda não há chats carregados
    const showLoader = chats.length === 0
    if (showLoader) setIsLoadingChats(true)

    try {
      const response = await fetch('/api/atendimento/chats')
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data: Chat[] = await response.json()
      setChats(data)
      if (data.length > 0 && !selectedChat) {
        handleSelectChat(data[0])
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar as conversas.')
    } finally {
      if (showLoader) setIsLoadingChats(false)
    }
  }

  // Função para buscar mensagens do chat selecionado
  const fetchMessages = async (chatId: string) => {
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
        const uniqueMap = new Map<string, boolean>()
        const unique = merged.filter(m => {
          if (uniqueMap.has(m.id)) return false
          uniqueMap.set(m.id, true)
          return true
        })
        // Ordenar por timestamp ascendente
        return unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar mensagens.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Polling para atualizar chats e mensagens a cada 1 segundo (mais fluido)
  useEffect(() => {
    fetchChats()
    const interval = setInterval(() => {
      fetchChats()
      if (selectedChat) {
        fetchMessages(selectedChat.id)
      }
    }, 1000) // Reduzido para 1 segundo
    return () => clearInterval(interval)
  }, [selectedChat])

  // Escutar eventos de novas mensagens de mídia
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const newMessage = event.detail
      setMessages(prev => [...prev, newMessage])
    }

    window.addEventListener('newMessage', handleNewMessage as EventListener)
    return () => window.removeEventListener('newMessage', handleNewMessage as EventListener)
  }, [])

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat)
    
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
    setMessages(prev => [...prev, optimisticMessage])
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
        prev.map(msg => msg.id === tempId ? { ...sentMessage, status: 'sent' } : msg)
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
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingMessages && messages.length === 0}
              onToggleAI={handleToggleAI}
              onAssumeChat={handleAssumeChat}
              onAssignAgent={handleAssignAgent}
              onMarkResolved={handleMarkResolved}
              onCustomerUpdate={handleCustomerUpdate}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 