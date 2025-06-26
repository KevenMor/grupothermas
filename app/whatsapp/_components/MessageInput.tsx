'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Send, 
  Paperclip, 
  Smile,
  Mic,
  Loader2
} from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false,
  placeholder = "Digite uma mensagem..."
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!message.trim() || isLoading || disabled) return
    
    onSendMessage(message.trim())
    setMessage('')
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 flex-shrink-0">
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className="pr-12"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading || disabled}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 flex-shrink-0">
          <Smile className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 flex-shrink-0">
          <Mic className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 