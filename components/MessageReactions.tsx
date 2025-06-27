import React, { useState } from 'react'
import { Reaction } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MessageReactionsProps {
  reactions: Reaction[]
  isFromAgent: boolean
  onReactionClick?: (emoji: string) => void
  className?: string
}

interface ReactionGroup {
  emoji: string
  count: number
  users: Reaction[]
}

export function MessageReactions({ 
  reactions, 
  isFromAgent, 
  onReactionClick,
  className 
}: MessageReactionsProps) {
  const [showReactionsDialog, setShowReactionsDialog] = useState(false)

  if (!reactions || reactions.length === 0) {
    return null
  }

  // Agrupar reações por emoji
  const reactionGroups: ReactionGroup[] = reactions.reduce((groups: ReactionGroup[], reaction) => {
    const existingGroup = groups.find(group => group.emoji === reaction.emoji)
    
    if (existingGroup) {
      existingGroup.count++
      existingGroup.users.push(reaction)
    } else {
      groups.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction]
      })
    }
    
    return groups
  }, [])

  // Ordenar grupos por contagem (mais reações primeiro)
  reactionGroups.sort((a, b) => b.count - a.count)

  const handleReactionClick = () => {
    if (reactionGroups.length > 0) {
      setShowReactionsDialog(true)
    }
  }

  const formatReactionTooltip = (group: ReactionGroup) => {
    const userNames = group.users.map(r => r.by).join(', ')
    return `${group.emoji} ${group.count > 1 ? `x${group.count}` : ''} - ${userNames}`
  }

  return (
    <>
      <TooltipProvider>
        <div 
          className={cn(
            "flex gap-1 items-center mt-1",
            isFromAgent ? "justify-end" : "justify-start",
            className
          )}
        >
          {reactionGroups.slice(0, 3).map((group, index) => (
            <Tooltip key={group.emoji}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-1.5 text-xs rounded-full border transition-all hover:scale-105",
                    isFromAgent 
                      ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={handleReactionClick}
                >
                  <span className="text-sm">{group.emoji}</span>
                  {group.count > 1 && (
                    <span className="ml-1 text-xs font-medium">
                      {group.count}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatReactionTooltip(group)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {reactionGroups.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-1.5 text-xs rounded-full border transition-all hover:scale-105",
                    isFromAgent 
                      ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={handleReactionClick}
                >
                  +{reactionGroups.length - 3}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver todas as reações</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Dialog com todas as reações */}
      <Dialog open={showReactionsDialog} onOpenChange={setShowReactionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reações da mensagem</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {reactionGroups.map((group) => (
              <div key={group.emoji} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.emoji}</span>
                  <div>
                    <p className="font-medium">
                      {group.emoji} {group.count > 1 && `(${group.count})`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {group.users.map(r => r.by).join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex -space-x-2">
                  {group.users.slice(0, 3).map((reaction, index) => (
                    <Avatar key={index} className="w-6 h-6 border-2 border-white">
                      <AvatarFallback className="text-xs">
                        {reaction.by.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {group.users.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-medium">+{group.users.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 