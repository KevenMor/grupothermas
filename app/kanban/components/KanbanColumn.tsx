'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  color: string
  children: React.ReactNode
}

export function KanbanColumn({ id, title, count, color, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
          {count}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors",
          isOver 
            ? "border-thermas-blue-500 bg-thermas-blue-50 dark:bg-thermas-blue-900/20" 
            : "border-gray-200 dark:border-gray-700"
        )}
      >
        <div className="space-y-3">
          {children}
        </div>
        
        {count === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600">
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-sm">Nenhuma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 