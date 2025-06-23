// Mock data para demonstração do Kanban
export const mockChats = [
  // IA Column
  {
    id: 'chat-ai-1',
    customerName: 'Maria Silva',
    customerPhone: '+55 11 99999-1111',
    lastMessage: 'Olá! Gostaria de saber mais sobre os pacotes disponíveis.',
    unreadCount: 2,
    status: 'ai' as const,
    assignedTo: null,
    updatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    avatar: null,
    workspaceId: 'demo'
  },
  {
    id: 'chat-ai-2', 
    customerName: 'João Santos',
    customerPhone: '+55 11 99999-2222',
    lastMessage: 'Qual o preço do pacote família?',
    unreadCount: 1,
    status: 'ai' as const,
    assignedTo: null,
    updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    avatar: null,
    workspaceId: 'demo'
  },
  
  // Waiting Column
  {
    id: 'chat-waiting-1',
    customerName: 'Ana Costa',
    customerPhone: '+55 11 99999-3333', 
    lastMessage: 'Preciso falar com um humano sobre desconto especial.',
    unreadCount: 3,
    status: 'waiting' as const,
    assignedTo: null,
    updatedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    avatar: null,
    workspaceId: 'demo'
  },
  {
    id: 'chat-waiting-2',
    customerName: 'Carlos Oliveira',
    customerPhone: '+55 11 99999-4444',
    lastMessage: 'A IA não conseguiu responder minha dúvida sobre cancelamento.',
    unreadCount: 1,
    status: 'waiting' as const,
    assignedTo: null,
    updatedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago
    avatar: null,
    workspaceId: 'demo'
  },

  // Human Column (seria filtrado por assignedTo === user.uid)
  {
    id: 'chat-human-1',
    customerName: 'Fernanda Lima',
    customerPhone: '+55 11 99999-5555',
    lastMessage: 'Obrigada pelo atendimento! Vou pensar na proposta.',
    unreadCount: 0,
    status: 'human' as const,
    assignedTo: 'current-user-id', // seria o user.uid real
    updatedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    avatar: null,
    workspaceId: 'demo'
  }
]

export const mockMessages = {
  'chat-ai-1': [
    {
      id: 'msg-1',
      chatId: 'chat-ai-1',
      content: 'Olá! Bem-vindo ao Grupo Thermas! 😊',
      type: 'text' as const,
      sender: 'ai' as const,
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      agentName: null
    },
    {
      id: 'msg-2', 
      chatId: 'chat-ai-1',
      content: 'Olá! Gostaria de saber mais sobre os pacotes disponíveis.',
      type: 'text' as const,
      sender: 'customer' as const,
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      agentName: null
    },
    {
      id: 'msg-3',
      chatId: 'chat-ai-1', 
      content: 'Temos diversos pacotes! Você gostaria de saber sobre qual tipo específico?',
      type: 'text' as const,
      sender: 'ai' as const,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      agentName: null
    }
  ],
  'chat-human-1': [
    {
      id: 'msg-h1',
      chatId: 'chat-human-1',
      content: 'Olá! Sou o João, vou te ajudar pessoalmente.',
      type: 'text' as const,
      sender: 'agent' as const,
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      agentName: 'João - Grupo Thermas'
    },
    {
      id: 'msg-h2',
      chatId: 'chat-human-1',
      content: 'Perfeito! Preciso de uma proposta personalizada.',
      type: 'text' as const,
      sender: 'customer' as const,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      agentName: null
    },
    {
      id: 'msg-h3',
      chatId: 'chat-human-1',
      content: 'Obrigada pelo atendimento! Vou pensar na proposta.',
      type: 'text' as const,
      sender: 'customer' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      agentName: null
    }
  ]
}

// Função para popular Firestore com dados de teste
export async function createMockChatData(userId: string) {
  const { collection, doc, setDoc, addDoc } = await import('firebase/firestore')
  const { db } = await import('./firebase')

  try {
    // Criar chats
    for (const chat of mockChats) {
      const chatData = {
        ...chat,
        assignedTo: chat.status === 'human' ? userId : null
      }
      
      await setDoc(doc(db, 'chats', chat.id), chatData)
    }

    // Criar mensagens
    for (const [chatId, messages] of Object.entries(mockMessages)) {
      for (const message of messages) {
        await addDoc(collection(db, 'messages', chatId, 'messages'), message)
      }
    }

    console.log('✅ Dados de teste criados com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error)
    return false
  }
} 