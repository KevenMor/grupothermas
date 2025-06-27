import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void
  disabled?: boolean
  className?: string
}

// Emojis comuns do WhatsApp
const COMMON_REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🙏', label: 'Pray' }
]

export function ReactionPicker({ 
  onReactionSelect, 
  disabled = false,
  className 
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleReactionClick = (emoji: string) => {
    onReactionSelect(emoji)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            className
          )}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2" 
        align="center"
        side="top"
      >
        <div className="flex gap-1">
          {COMMON_REACTIONS.map((reaction) => (
            <Button
              key={reaction.emoji}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110"
              onClick={() => handleReactionClick(reaction.emoji)}
              title={reaction.label}
            >
              <span className="text-lg">{reaction.emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 