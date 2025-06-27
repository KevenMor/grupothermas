/**
 * Utility para notificações sonoras e visuais
 */

// URL pública para o som de notificação
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3'

/**
 * Reproduz um alerta sonoro
 */
export function playNotificationSound(): void {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL)
    audio.volume = 0.5 // Volume moderado
    
    // Verificar se o arquivo existe antes de tentar reproduzir
    audio.addEventListener('error', () => {
      console.warn('Arquivo de som de notificação não encontrado, usando fallback')
      // Fallback: usar beep do navegador se disponível
      if ('AudioContext' in window) {
        try {
          const audioContext = new AudioContext()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800Hz
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // Volume baixo
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        } catch (fallbackError) {
          console.warn('Fallback de som também falhou:', fallbackError)
        }
      }
    })
    
    audio.play().catch(error => {
      console.warn('Erro ao reproduzir som de notificação:', error)
    })
  } catch (error) {
    console.warn('Erro ao criar áudio de notificação:', error)
  }
}

/**
 * Verifica se o navegador suporta notificações
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Exibe notificação do navegador
 */
export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  } catch (error) {
    console.warn('Erro ao exibir notificação do navegador:', error)
  }
}

/**
 * Atualiza badge de mensagens não lidas
 */
export function updateUnreadBadge(conversationId: string, unreadCount: number): void {
  try {
    // Atualizar badge na lista de conversas
    const badgeElement = document.querySelector(`[data-conversation-id="${conversationId}"] .unread-badge`)
    
    if (badgeElement) {
      if (unreadCount > 0) {
        badgeElement.textContent = unreadCount.toString()
        badgeElement.classList.remove('hidden')
      } else {
        badgeElement.classList.add('hidden')
      }
    }

    // Atualizar badge global se houver
    const globalBadge = document.querySelector('.global-unread-badge')
    if (globalBadge) {
      const totalUnread = document.querySelectorAll('.unread-badge:not(.hidden)').length
      if (totalUnread > 0) {
        globalBadge.textContent = totalUnread.toString()
        globalBadge.classList.remove('hidden')
      } else {
        globalBadge.classList.add('hidden')
      }
    }
  } catch (error) {
    console.warn('Erro ao atualizar badge:', error)
  }
}

/**
 * Verifica se um chat está ativo (visível)
 */
export function isChatActive(conversationId: string): boolean {
  try {
    const chatContainer = document.querySelector(`[data-chat-id="${conversationId}"]`)
    return chatContainer !== null && !chatContainer.classList.contains('hidden')
  } catch {
    return false
  }
}

/**
 * Notifica nova mensagem com som e badge
 */
export function notifyNewMessage(conversationId: string, unreadCount: number, messagePreview?: string): void {
  // Reproduzir som se o chat não estiver ativo
  if (!isChatActive(conversationId)) {
    playNotificationSound()
    
    // Tentar notificação do navegador
    if (messagePreview) {
      showBrowserNotification('Nova mensagem', {
        body: messagePreview,
        tag: conversationId // Evita múltiplas notificações para o mesmo chat
      })
    }
  }

  // Atualizar badge
  updateUnreadBadge(conversationId, unreadCount)
}

/**
 * Reseta contador de mensagens não lidas para um chat
 */
export function resetUnreadCount(conversationId: string): void {
  updateUnreadBadge(conversationId, 0)
}

/**
 * Inicializa sistema de notificações
 */
export async function initializeNotifications(): Promise<void> {
  try {
    // Solicitar permissão para notificações
    await requestNotificationPermission()
    
    console.log('Sistema de notificações inicializado')
  } catch (error) {
    console.warn('Erro ao inicializar notificações:', error)
  }
} 