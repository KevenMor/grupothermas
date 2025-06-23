import { Chat } from '@/lib/models'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, ListFilter, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
  isLoading: boolean
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }
  if (isYesterday(date)) {
    return 'Ontem'
  }
  return format(date, 'dd/MM/yy', { locale: ptBR })
}

const ChatListItem = ({ chat, isSelected, onSelectChat }: { chat: Chat, isSelected: boolean, onSelectChat: (chat: Chat) => void }) => (
  <button
    onClick={() => onSelectChat(chat)}
    className={cn(
      "w-full text-left flex items-start p-3 gap-3 transition-colors",
      isSelected ? "bg-white dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
    )}
  >
    <Avatar className="w-12 h-12 border-2 border-transparent">
      <AvatarImage src={chat.customerAvatar} />
      <AvatarFallback className="text-lg bg-gray-200 dark:bg-gray-700">
        {chat.customerName.charAt(0)}
      </AvatarFallback>
    </Avatar>
    <div className="flex-grow truncate border-b border-gray-200 dark:border-gray-700 pb-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{chat.customerName}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(chat.timestamp)}</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage}</p>
      {chat.unreadCount > 0 && (
        <div className="flex justify-end">
          <Badge className="bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center p-0 mt-1">
            {chat.unreadCount}
          </Badge>
        </div>
      )}
    </div>
  </button>
)

export function ChatList({ chats, selectedChat, onSelectChat, isLoading }: ChatListProps) {
  // TODO: Implement filtering logic for tabs
  const filteredChats = chats

  return (
    <div className="w-[380px] border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Inicie ou procure uma conversa" className="pl-9 pr-10 bg-white dark:bg-gray-700/50 rounded-full" />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <ListFilter className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="chats" className="flex-grow flex flex-col">
        <TabsList className="px-4">
          <TabsTrigger value="chats" className="flex-1">Chats ({filteredChats.length})</TabsTrigger>
          <TabsTrigger value="espera" className="flex-1">Espera (0)</TabsTrigger>
          <TabsTrigger value="andamento" className="flex-1">Andamento (0)</TabsTrigger>
        </TabsList>

        <div className="flex-grow overflow-y-auto">
          <TabsContent value="chats" className="m-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                 {filteredChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChat?.id === chat.id}
                      onSelectChat={onSelectChat}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          {/* TODO: Add content for other tabs */}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-gray-600 dark:text-gray-300">
            <Archive className="w-4 h-4 mr-3" />
            Conversas arquivadas
          </Button>
        </div>
      </Tabs>
    </div>
  )
} 