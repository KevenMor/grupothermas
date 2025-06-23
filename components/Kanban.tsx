'use client'

import { useState } from 'react'
import { Lead } from '@/lib/models'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Phone, Mail } from 'lucide-react'

interface KanbanProps {
  leads: Lead[]
  onUpdateLead: (leadId: string, stage: Lead['stage']) => void
  onAddLead: () => void
}

const stages = [
  { id: 'new', title: 'Novo', color: 'bg-blue-50 border-blue-200' },
  { id: 'proposal', title: 'Em Proposta', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'waiting_signature', title: 'Aguardando Assinatura', color: 'bg-orange-50 border-orange-200' },
  { id: 'completed', title: 'Concluído', color: 'bg-green-50 border-green-200' },
] as const

export default function Kanban({ leads, onUpdateLead, onAddLead }: KanbanProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead)
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStage: Lead['stage']) => {
    e.preventDefault()
    if (draggedLead && draggedLead.id) {
      onUpdateLead(draggedLead.id, targetStage)
    }
    setDraggedLead(null)
  }

  const getLeadsByStage = (stage: Lead['stage']) => {
    return leads.filter(lead => lead.stage === stage)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className={`rounded-lg border-2 border-dashed p-4 min-h-[500px] ${stage.color}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage.id as Lead['stage'])}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">{stage.title}</h3>
            <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
              {getLeadsByStage(stage.id as Lead['stage']).length}
            </span>
          </div>

          {stage.id === 'new' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddLead}
              className="w-full mb-4 border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Lead
            </Button>
          )}

          <div className="space-y-3">
            {getLeadsByStage(stage.id as Lead['stage']).map((lead) => (
              <Card
                key={lead.id}
                className="cursor-move hover:shadow-md transition-shadow bg-white"
                draggable
                onDragStart={() => handleDragStart(lead)}
                onDragEnd={handleDragEnd}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{lead.name}</h4>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}

                  <div className="text-xs text-gray-400 mt-3">
                    {lead.createdAt?.toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 