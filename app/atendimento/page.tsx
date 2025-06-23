'use client'

import { useState, useEffect, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Send, 
  Phone, 
  Bot, 
  User, 
  Clock, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Zap,
  Calendar,
  CreditCard,
  HeadphonesIcon,
  ArrowRight,
  Loader2,
  Users,
  Image,
  FileText,
  Mic,
  Smile,
  Plus,
  X,
  Search,
  ListFilter,
  Archive,
  MoreVertical,
  ChevronDown,
  MessageSquarePlus,
  UserPlus,
  Tag,
  Upload,
  VolumeX,
  Bell
} from 'lucide-react'
import { ChatCustomer, ChatMessage } from '@/lib/models'
import { Toaster, toast } from 'sonner'
import { format } from 'date-fns'

export default function AtendimentoPage() {
  const [customers, setCustomers] = useState<ChatCustomer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<ChatCustomer | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '' })
  const [showMediaOptions, setShowMediaOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingChats(true)
      try {
        const response = await fetch('/api/atendimento/chats')
        if (response.ok) {
          const data: ChatCustomer[] = await response.json()
          setCustomers(data)
        } else {
          toast.error('Não foi possível carregar as conversas.')
        }
      } catch (error) {
        toast.error('Erro de rede ao carregar as conversas.')
      } finally {
        setIsLoadingChats(false)
      }
    }
    fetchCustomers()
  }, [])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSelectCustomer = async (customer: ChatCustomer) => {
    setSelectedCustomer(customer)
    setMessages([])
    setIsLoadingMessages(true)
    try {
      const response = await fetch('/api/atendimento/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone })
      })
      if (response.ok) {
        const data: ChatMessage[] = await response.json()
        setMessages(data)
      } else {
        toast.error(`Não foi possível carregar as mensagens de ${customer.name}.`)
      }
    } catch (error) {
      toast.error('Erro de rede ao buscar mensagens.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCustomer) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      role: 'agent',
      sender: 'agent',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    const messageToSend = newMessage
    setNewMessage('')
    setIsLoading(true)

    try {
        const response = await fetch('/api/admin/test-zapi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: selectedCustomer.phone,
                message: messageToSend,
            }),
        });
        if (!response.ok) {
            toast.error('Falha ao enviar mensagem.');
            setMessages(prev => prev.filter(m => m.id !== userMessage.id))
        }
    } catch (error) {
       toast.error('Erro ao enviar mensagem.')
       setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFeatureInDev = () => {
    toast.info('Funcionalidade em desenvolvimento.')
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <AppLayout>
      <Toaster richColors />
      <div className="flex h-[calc(100vh-4rem)] border-t">
        {/* Sidebar */}
        <div className="w-[360px] border-r flex flex-col bg-slate-50 dark:bg-slate-900">
          {/* Sidebar Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  Todos
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleFeatureInDev}>Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={handleFeatureInDev}>Não lidos</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleFeatureInDev}>
                <MessageSquarePlus className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowAddContact(true)}>
                <UserPlus className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleFeatureInDev}><Tag className="w-4 h-4 mr-2" /> Etiquetas</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFeatureInDev}><Zap className="w-4 h-4 mr-2" /> Mensagens rápidas</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFeatureInDev}><Upload className="w-4 h-4 mr-2" /> Exportar CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFeatureInDev}><FileText className="w-4 h-4 mr-2" /> Campos Padrão</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFeatureInDev}><VolumeX className="w-4 h-4 mr-2" /> Desativar som</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFeatureInDev}><Bell className="w-4 h-4 mr-2" /> Ativar notificação</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Inicie uma nova conversa" className="pl-9 pr-10" />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                <ListFilter className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chats" className="flex-grow flex flex-col">
            <TabsList className="m-3">
              <TabsTrigger value="chats" className="flex-1">Chats ({customers.length})</TabsTrigger>
              <TabsTrigger value="espera" className="flex-1">Espera (0)</TabsTrigger>
              <TabsTrigger value="andamento" className="flex-1">Andamento (0)</TabsTrigger>
            </TabsList>

            <div className="flex-grow overflow-y-auto">
              <TabsContent value="chats">
                {isLoadingChats ? (
                  <div className="flex justify-center items-center h-full p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`flex items-start p-3 cursor-pointer border-b ${
                        selectedCustomer?.id === customer.id ? 'bg-white dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Avatar className="w-10 h-10 mr-3">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${customer.name.replace(' ','+')}&background=random`} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold truncate text-sm">{customer.name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(customer.timestamp), 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{customer.lastMessage}</p>
                        <div className="mt-1">
                          <Badge variant="secondary">Geral</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="espera">
                  <div className="text-center p-8 text-muted-foreground">Nenhuma conversa em espera.</div>
              </TabsContent>
              <TabsContent value="andamento">
                  <div className="text-center p-8 text-muted-foreground">Nenhuma conversa em andamento.</div>
              </TabsContent>
            </div>
            
            <div className="p-3 border-t">
              <Button variant="ghost" className="w-full justify-start">
                <Archive className="w-4 h-4 mr-2" />
                Conversas arquivadas
              </Button>
            </div>
          </Tabs>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          {selectedCustomer ? (
             <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
               {/* Chat Header */}
               <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700">
                   <Avatar className="w-10 h-10 mr-3">
                     <AvatarImage src={`https://ui-avatars.com/api/?name=${selectedCustomer.name.replace(' ','+')}&background=random`} />
                     <AvatarFallback>{getInitials(selectedCustomer.name)}</AvatarFallback>
                   </Avatar>
                   <div>
                       <h3 className="font-semibold">{selectedCustomer.name}</h3>
                       <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                   </div>
               </div>
   
               {/* Messages */}
               <div className="flex-1 p-4 overflow-y-auto" ref={messagesEndRef}>
                 {isLoadingMessages ? (
                   <div className="flex justify-center items-center h-full">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                   </div>
                 ) : (
                   messages.map((msg) => {
                     const isUser = msg.role === 'user'
                     
                     // Fallback for older messages that might use 'sender'
                     const isUserLegacy = !msg.role && msg.sender === 'user'

                     const isSentByCustomer = isUser || isUserLegacy

                     return (
                       <div
                         key={msg.id}
                         className={`flex items-end gap-2 ${
                           isSentByCustomer ? 'justify-end' : 'justify-start'
                         }`}
                       >
                         <div className={`flex items-end gap-2 ${isSentByCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
                           <Avatar className="w-8 h-8">
                             <AvatarFallback>
                               {isSentByCustomer ? getInitials(selectedCustomer.name) : 'IA'}
                             </AvatarFallback>
                           </Avatar>
                           <div
                             className={`rounded-lg p-3 max-w-2xl shadow-sm ${
                               isSentByCustomer
                                 ? 'bg-blue-500 text-white'
                                 : 'bg-white dark:bg-slate-800'
                             }`}
                           >
                             <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                               {msg.content}
                             </p>
                             <span
                               className={`text-xs mt-1 block text-right ${
                                 isSentByCustomer
                                   ? 'text-blue-100'
                                   : 'text-muted-foreground'
                               }`}
                             >
                               {format(new Date(msg.timestamp), 'HH:mm')}
                             </span>
                           </div>
                         </div>
                       </div>
                     )
                   })
                 )}
               </div>
               
               {/* Message Input */}
               <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900">
                <div className="relative bg-white dark:bg-slate-800 rounded-lg">
                  <Input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                    disabled={isLoading}
                    className="pr-24 border-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <Button variant="ghost" size="icon" onClick={handleFeatureInDev}>
                      <Smile className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={sendMessage}
                      disabled={isLoading}
                      className="h-8 px-3 ml-2"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                 </div>
               </div>
             </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 bg-slate-100 dark:bg-slate-800/50">
              <svg className="w-24 h-24 mb-4 text-slate-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0C22.3858 0 0 22.3858 0 50C0 67.4526 8.71188 82.5936 21.875 91.1338V75.625C14.7075 69.2131 10 60.1175 10 50C10 27.9086 27.9086 10 50 10C72.0914 10 90 27.9086 90 50C90 72.0914 72.0914 90 50 90H43.75C46.7578 93.6191 50 95.8334 50 100L93.75 56.25C97.9166 52.0833 100 47.9167 100 50C100 22.3858 77.6142 0 50 0Z" fill="#7C3AED"/>
                <path d="M50 100C77.6142 100 100 77.6142 100 50C100 32.5474 91.2881 17.4064 78.125 8.86621V24.375C85.2925 30.7869 90 39.8825 90 50C90 72.0914 72.0914 90 50 90C27.9086 90 10 72.0914 10 50C10 49.375 10.0417 48.75 10.125 48.125L0 41.25C0 44.1667 0 47.0833 0 50C0 77.6142 22.3858 100 50 100Z" fill="#A78BFA"/>
              </svg>

              <h2 className="text-2xl font-semibold text-slate-600 dark:text-slate-300">Seu Atendimento Digital</h2>
              <p>Selecione um chat ao lado e continue atendendo seus clientes.</p>
            </div>
          )}
        </div>
        
        {/* Add Contact Modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Adicionar Contato</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddContact(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <Input
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {}}
                    className="flex-1"
                  >
                    Adicionar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddContact(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={() => {}}
          className="hidden"
        />
      </div>
    </AppLayout>
  )
} 