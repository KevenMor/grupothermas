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
      setIsLoadingChats(true)
      try {
        const response = await fetch('/api/atendimento/chats')
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data: Chat[] = await response.json()
      setChats(data)
      // Se não houver chat selecionado, seleciona o primeiro
      if (data.length > 0 && !selectedChat) {
        handleSelectChat(data[0])
        }
      } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar as conversas.')
      } finally {
        setIsLoadingChats(false)
      }
    }

  // Função para buscar mensagens do chat selecionado
  const fetchMessages = async (chatId: string) => {
    setIsLoadingMessages(true)
    setMessages([])
    try {
      const response = await fetch(`/api/atendimento/messages?chatId=${chatId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
        const data: ChatMessage[] = await response.json()
        setMessages(data)
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
      
      if (!response.ok) throw new Error('Failed to send message')
      
      const sentMessage: ChatMessage = await response.json()

      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? { ...sentMessage, status: 'sent' } : msg)
      )
      
      // Update chat list with new last message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: sentMessage.content, timestamp: sentMessage.timestamp }
          : chat
      ))

    } catch (error) {
      console.error(error)
       toast.error('Erro ao enviar mensagem.')
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg))
    }
  }

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          isLoading={isLoadingChats}
        />
        <ChatWindow
          chat={selectedChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingMessages}
        />
      </div>
    </AppLayout>
  )
} 