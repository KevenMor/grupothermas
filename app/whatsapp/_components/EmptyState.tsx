import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MessageCircle, 
  Smartphone, 
  QrCode,
  Plus
} from 'lucide-react'

interface EmptyStateProps {
  type: 'no-sessions' | 'no-connected-sessions' | 'no-contacts'
  onAction?: () => void
  actionText?: string
}

export function EmptyState({ type, onAction, actionText }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'no-sessions':
        return {
          icon: <Plus className="h-12 w-12 text-gray-400" />,
          title: 'Nenhuma sessão encontrada',
          description: 'Crie uma sessão WhatsApp primeiro para começar a usar o chat',
          actionText: 'Criar Sessão'
        }
      case 'no-connected-sessions':
        return {
          icon: <QrCode className="h-12 w-12 text-gray-400" />,
          title: 'Nenhuma sessão conectada',
          description: 'Conecte uma sessão WhatsApp para começar a usar o chat',
          actionText: 'Gerenciar Sessões'
        }
      case 'no-contacts':
        return {
          icon: <MessageCircle className="h-12 w-12 text-gray-400" />,
          title: 'Nenhum contato encontrado',
          description: 'Não há conversas ainda. Carregue dados de exemplo para testar o chat.',
          actionText: 'Carregar Dados de Exemplo'
        }
      default:
        return {
          icon: <Smartphone className="h-12 w-12 text-gray-400" />,
          title: 'Nada encontrado',
          description: 'Não há dados para exibir',
          actionText: 'Tentar Novamente'
        }
    }
  }

  const content = getContent()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {content.icon}
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
          {content.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
          {content.description}
        </p>
        {onAction && (
          <Button onClick={onAction} variant={type === 'no-contacts' ? 'outline' : 'default'}>
            {actionText || content.actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 