'use client'

import { useState } from 'react'
import { X, Plus, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TagManagerProps {
  chatId: string
  tags: string[]
  onTagsChange: (chatId: string, tags: string[]) => void
}

const predefinedTags = [
  'interessado',
  'orçamento',
  'família',
  'grupo',
  'desconto',
  'agendamento',
  'visita',
  'satisfeito',
  'reclamação',
  'dúvida',
  'pacote-família',
  'pacote-casal',
  'pacote-individual',
  'urgente',
  'vip',
  'retorno'
]

export function TagManager({ chatId, tags, onTagsChange }: TagManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const updatedTags = [...tags, tag]
      onTagsChange(chatId, updatedTags)
    }
    setNewTag('')
    setShowSuggestions(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    onTagsChange(chatId, updatedTags)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(newTag.trim().toLowerCase())
    }
  }

  const filteredSuggestions = predefinedTags.filter(tag => 
    !tags.includes(tag) && 
    tag.toLowerCase().includes(newTag.toLowerCase())
  ).slice(0, 5)

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 items-center">
        {tags.map(tag => (
          <Badge 
            key={tag} 
            variant="outline" 
            className="text-xs pr-1 group hover:bg-red-50 hover:border-red-200"
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag}
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value)
                  setShowSuggestions(e.target.value.length > 0)
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(newTag.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Nova tag..."
                className="w-32 h-6 text-xs"
              />
              
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                  {filteredSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddTag(suggestion)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                    >
                      <Tag className="h-3 w-3 mr-2 inline" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleAddTag(newTag.trim().toLowerCase())}
              disabled={!newTag.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setIsEditing(false)
                setNewTag('')
                setShowSuggestions(false)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            onClick={() => setIsEditing(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
} 