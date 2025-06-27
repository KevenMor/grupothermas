import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: 'center' | 'start' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
}

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(open || false)

  useEffect(() => {
    setIsOpen(!!open)
  }, [open])

  const handleOpenChange = (value: boolean) => {
    setIsOpen(value)
    if (onOpenChange) onOpenChange(value)
  }

  // Separar Trigger e Content
  let trigger: React.ReactNode = null
  let content: React.ReactNode = null
  React.Children.forEach(children, (child: any) => {
    if (child?.type === PopoverTrigger) {
      trigger = React.cloneElement(child, {
        onClick: () => handleOpenChange(!isOpen)
      })
    } else if (child?.type === PopoverContent) {
      if (isOpen) content = child
    }
  })

  return (
    <div className="relative inline-block">
      {trigger}
      {content}
    </div>
  )
}

export function PopoverTrigger({ children, asChild, onClick }: PopoverTriggerProps) {
  return (
    <span onClick={onClick} className="cursor-pointer">
      {children}
    </span>
  )
}

export function PopoverContent({ children, className, align = 'center', side = 'top' }: PopoverContentProps) {
  // Simplesmente renderiza abaixo do trigger
  return (
    <div
      className={cn(
        "absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 mt-2",
        className
      )}
      style={{ minWidth: 120 }}
    >
      {children}
    </div>
  )
} 