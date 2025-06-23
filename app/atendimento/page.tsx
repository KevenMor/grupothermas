'use client'

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
        // Só atualiza se mudou
        if (JSON.stringify(prev.filter(m => m.status !== 'failed')) !== JSON.stringify(data)) {
          return [...data, ...failed]
        }
        return prev
      })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar mensagens.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Polling para atualizar chats e mensagens a cada 5 segundos
  useEffect(() => {
    fetchChats()
    const interval = setInterval(() => {
      fetchChats()
      if (selectedChat) {
        fetchMessages(selectedChat.id)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedChat])

  const handleSelectChat = async (chat: Chat) => {
    if (selectedChat?.id === chat.id) return
    setSelectedChat(chat)
    fetchMessages(chat.id)
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedChat) return
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content,
      role: 'agent',
      timestamp: new Date().toISOString(),
      status: 'sending',
    }
    setMessages(prev => [...prev, optimisticMessage])
    try {
      const response = await fetch('/api/atendimento/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content,
          phone: selectedChat.customerPhone,
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
      toast.error(error.message || 'Erro ao enviar mensagem.')
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg))
    }
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
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 