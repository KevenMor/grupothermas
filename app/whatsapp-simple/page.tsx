'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Bot, 
  Zap, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'

export default function WhatsAppSimplePage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="h-12 w-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              WhatsApp Business
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Integração inteligente para automação de atendimento
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="solutions">Soluções</TabsTrigger>
            <TabsTrigger value="setup">Configuração</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp Business
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Conecte seu número WhatsApp para receber e enviar mensagens automaticamente
                  </p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    API Oficial
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Bot className="h-5 w-5" />
                    Inteligência Artificial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Respostas automáticas inteligentes usando OpenAI GPT-4
                  </p>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    GPT-4 Turbo
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Zap className="h-5 w-5" />
                    Automação N8N
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Workflows personalizados para processos complexos
                  </p>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    Self-Hosted
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>🚀 Funcionalidades Principais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Respostas automáticas 24/7</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Múltiplos números WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Integração com IA personalizada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Dashboard de monitoramento</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Handoff para atendentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Relatórios de performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Webhooks personalizados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Backup automático</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solutions Tab */}
          <TabsContent value="solutions" className="space-y-6">
            <div className="grid gap-6">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    Opção 1: Zapier + WhatsApp Business API
                  </CardTitle>
                  <Badge className="w-fit bg-green-100 text-green-700">Recomendado para iniciantes</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Solução mais simples e estável usando Zapier para conectar WhatsApp Business API com OpenAI.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">✅ Sem código</Badge>
                    <Badge variant="outline">✅ Interface visual</Badge>
                    <Badge variant="outline">✅ Suporte oficial</Badge>
                    <Badge variant="outline">✅ Mais estável</Badge>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configurar Zapier
                    </Button>
                    <Button variant="outline">
                      Ver Tutorial
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Opção 2: N8N Self-Hosted
                  </CardTitle>
                  <Badge className="w-fit bg-purple-100 text-purple-700">Controle total</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Solução open-source com controle total sobre dados e processos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">✅ Gratuito</Badge>
                    <Badge variant="outline">✅ Self-hosted</Badge>
                    <Badge variant="outline">✅ Visual workflow</Badge>
                    <Badge variant="outline">✅ Privacidade total</Badge>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Instalar N8N
                    </Button>
                    <Button variant="outline">
                      Ver Documentação
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-orange-600" />
                    Opção 3: Chatwoot + API
                  </CardTitle>
                  <Badge className="w-fit bg-orange-100 text-orange-700">Interface completa</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Plataforma completa de atendimento com interface web para agentes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">✅ Multi-canal</Badge>
                    <Badge variant="outline">✅ Dashboard completo</Badge>
                    <Badge variant="outline">✅ Agentes humanos</Badge>
                    <Badge variant="outline">✅ Relatórios</Badge>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configurar Chatwoot
                    </Button>
                    <Button variant="outline">
                      Demo Online
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🛠️ Configuração Rápida</CardTitle>
                <p className="text-gray-600">Escolha uma das opções abaixo para começar</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">1. WhatsApp Business API</h3>
                  <div className="pl-4 space-y-2">
                    <p className="text-sm text-gray-600">• Criar conta WhatsApp Business</p>
                    <p className="text-sm text-gray-600">• Verificar número de telefone</p>
                    <p className="text-sm text-gray-600">• Obter token de acesso</p>
                  </div>
                  <Input placeholder="Token WhatsApp Business API" />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">2. OpenAI Configuration</h3>
                  <div className="pl-4 space-y-2">
                    <p className="text-sm text-gray-600">• Criar conta OpenAI</p>
                    <p className="text-sm text-gray-600">• Gerar API key</p>
                    <p className="text-sm text-gray-600">• Configurar prompts</p>
                  </div>
                  <Input placeholder="sk-..." type="password" />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">3. N8N Webhook (Opcional)</h3>
                  <div className="pl-4 space-y-2">
                    <p className="text-sm text-gray-600">• Instalar N8N</p>
                    <p className="text-sm text-gray-600">• Criar workflow</p>
                    <p className="text-sm text-gray-600">• Configurar webhook</p>
                  </div>
                  <Input placeholder="https://n8n.exemplo.com/webhook/..." />
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Status Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WhatsApp Business API</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Não Configurado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OpenAI Integration</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Não Configurado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">N8N Webhook</span>
                    <Badge variant="outline" className="text-gray-600 border-gray-200">
                      Opcional
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-400">--</div>
                    <div className="text-sm text-gray-500">Mensagens hoje</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-gray-400">--</div>
                      <div className="text-xs text-gray-500">Recebidas</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-400">--</div>
                      <div className="text-xs text-gray-500">Enviadas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 