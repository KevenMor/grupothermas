import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content?: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

export function Tooltip({ 
  children, 
  content, 
  side = 'top', 
  align = 'center',
  className 
}: TooltipProps) {
  // Detecta se está usando o padrão Radix (Trigger/Content)
  const isRadixPattern = React.Children.toArray(children).some(
    (child: any) => child?.type?.displayName === 'TooltipTrigger' || child?.type?.displayName === 'TooltipContent'
  )

  if (isRadixPattern) {
    // Padrão Radix: renderiza os filhos normalmente
    return <>{children}</>
  }

  // Padrão content prop
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (!triggerRef.current) return
    
    const rect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current?.getBoundingClientRect()
    
    let top = 0
    let left = 0
    
    switch (side) {
      case 'top':
        top = rect.top - (contentRect?.height || 0) - 8
        left = rect.left + rect.width / 2 - (contentRect?.width || 0) / 2
        break
      case 'bottom':
        top = rect.bottom + 8
        left = rect.left + rect.width / 2 - (contentRect?.width || 0) / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - (contentRect?.height || 0) / 2
        left = rect.left - (contentRect?.width || 0) - 8
        break
      case 'right':
        top = rect.top + rect.height / 2 - (contentRect?.height || 0) / 2
        left = rect.right + 8
        break
    }
    
    setPosition({ top, left })
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className="inline-block"
    >
      {children}
      {isVisible && content && (
        <div
          ref={contentRef}
          className={cn(
            "fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            className
          )}
          style={{
            top: position.top,
            left: position.left
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export function TooltipContent({ children, className }: TooltipContentProps) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <div
      className={cn(
        "fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ display: isVisible ? 'block' : 'block' }}
    >
      {children}
    </div>
  )
}
TooltipContent.displayName = 'TooltipContent'

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  return <>{children}</>
}
TooltipTrigger.displayName = 'TooltipTrigger'

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
} 