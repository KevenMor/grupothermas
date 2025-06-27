"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Building2, 
  FileText, 
  MessageSquare, 
  Settings, 
  Save, 
  Play, 
  Brain,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  BookOpen,
  Users,
  Shield,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Activity,
  Database,
  Wifi,
  Eye,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TrainingField {
  id: string;
  type: 'text' | 'textarea' | 'list' | 'rules' | 'actions' | 'integrations';
  label: string;
  value: string | string[] | Record<string, any>;
  required: boolean;
  description?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

interface AgentTraining {
  id: string;
  name: string;
  company: string;
  description: string;
  personality: string;
  expertise: string[];
  trainingText: string;
  examples: string[];
  rules: string[];
  forbiddenPhrases: string[];
  exceptions: string[];
  alerts: string[];
  actions: string[];
  integrations: Record<string, any>;
  context: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  openaiModel: string;
  openaiTemperature: number;
  openaiMaxTokens: number;
}

export default function PremiumTrainingPage() {
  // Estado do agente
  const [agent, setAgent] = useState<AgentTraining>({
    id: 'default',
    name: 'Assistente Thermas',
    company: 'Grupo Thermas',
    description: 'Assistente virtual especializado em atendimento ao cliente',
    personality: 'Empático, profissional e eficiente',
    expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
    trainingText: '',
    examples: [],
    rules: [],
    forbiddenPhrases: [],
    exceptions: [],
    alerts: [],
    actions: [],
    integrations: {},
    context: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    openaiModel: 'gpt-4',
    openaiTemperature: 0.7,
    openaiMaxTokens: 1000
  });

  // Estados de interface
  const [activeSection, setActiveSection] = useState<'basic' | 'training' | 'rules' | 'actions' | 'integrations' | 'advanced'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Estados para campos dinâmicos
  const [newExample, setNewExample] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newForbiddenPhrase, setNewForbiddenPhrase] = useState('');
  const [newException, setNewException] = useState('');
  const [newAlert, setNewAlert] = useState('');
  const [newAction, setNewAction] = useState('');

  // Carregar dados do Firebase
  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      const response = await fetch('/api/admin/training-data');
      if (response.ok) {
        const data = await response.json();
        if (data.agent) {
          setAgent(data.agent);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de treinamento:', error);
    }
  };

  // Salvar no Firebase
  const saveTraining = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/training-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent })
      });

      if (response.ok) {
        toast.success('Treinamento salvo com sucesso!');
        // Sincronizar com OpenAI
        await syncWithOpenAI();
      } else {
        throw new Error('Erro ao salvar treinamento');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar treinamento');
    } finally {
      setIsSaving(false);
    }
  };

  // Sincronizar com OpenAI
  const syncWithOpenAI = async () => {
    try {
      const trainingPrompt = generateTrainingPrompt();
      
      const response = await fetch('/api/admin/openai-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          trainingPrompt,
          model: agent.openaiModel,
          temperature: agent.openaiTemperature,
          maxTokens: agent.openaiMaxTokens
        })
      });

      if (response.ok) {
        toast.success('Sincronizado com OpenAI!');
      } else {
        throw new Error('Erro ao sincronizar com OpenAI');
      }
    } catch (error) {
      console.error('Erro ao sincronizar com OpenAI:', error);
      toast.error('Erro ao sincronizar com OpenAI');
    }
  };

  // Gerar prompt de treinamento
  const generateTrainingPrompt = () => {
    return `
# Configuração do Agente IA: ${agent.name}

## Informações Básicas
- **Nome:** ${agent.name}
- **Empresa:** ${agent.company}
- **Descrição:** ${agent.description}
- **Personalidade:** ${agent.personality}
- **Expertise:** ${agent.expertise.join(', ')}

## Texto de Treinamento
${agent.trainingText}

## Exemplos Práticos
${agent.examples.map((example, index) => `${index + 1}. ${example}`).join('\n')}

## Regras e Boas Práticas
${agent.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

## Frases Proibidas
${agent.forbiddenPhrases.map((phrase, index) => `${index + 1}. ${phrase}`).join('\n')}

## Exceções e Alertas
${agent.exceptions.map((exception, index) => `${index + 1}. ${exception}`).join('\n')}
${agent.alerts.map((alert, index) => `⚠️ ${alert}`).join('\n')}

## Ações Específicas
${agent.actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}

## Contexto Adicional
${agent.context}
    `.trim();
  };

  // Funções para campos dinâmicos
  const addExample = () => {
    if (newExample.trim()) {
      setAgent(prev => ({
        ...prev,
        examples: [...prev.examples, newExample.trim()]
      }));
      setNewExample('');
    }
  };

  const removeExample = (index: number) => {
    setAgent(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setAgent(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setAgent(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const addForbiddenPhrase = () => {
    if (newForbiddenPhrase.trim()) {
      setAgent(prev => ({
        ...prev,
        forbiddenPhrases: [...prev.forbiddenPhrases, newForbiddenPhrase.trim()]
      }));
      setNewForbiddenPhrase('');
    }
  };

  const removeForbiddenPhrase = (index: number) => {
    setAgent(prev => ({
      ...prev,
      forbiddenPhrases: prev.forbiddenPhrases.filter((_, i) => i !== index)
    }));
  };

  const addException = () => {
    if (newException.trim()) {
      setAgent(prev => ({
        ...prev,
        exceptions: [...prev.exceptions, newException.trim()]
      }));
      setNewException('');
    }
  };

  const removeException = (index: number) => {
    setAgent(prev => ({
      ...prev,
      exceptions: prev.exceptions.filter((_, i) => i !== index)
    }));
  };

  const addAlert = () => {
    if (newAlert.trim()) {
      setAgent(prev => ({
        ...prev,
        alerts: [...prev.alerts, newAlert.trim()]
      }));
      setNewAlert('');
    }
  };

  const removeAlert = (index: number) => {
    setAgent(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    if (newAction.trim()) {
      setAgent(prev => ({
        ...prev,
        actions: [...prev.actions, newAction.trim()]
      }));
      setNewAction('');
    }
  };

  const removeAction = (index: number) => {
    setAgent(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  // Testar treinamento
  const testTraining = async () => {
    setIsTesting(true);
    try {
      const trainingPrompt = generateTrainingPrompt();
      
      const response = await fetch('/api/admin/test-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingPrompt,
          testMessage: 'Olá, como você pode me ajudar?'
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Teste realizado com sucesso!');
        console.log('Resposta da IA:', result.response);
      } else {
        throw new Error('Erro ao testar treinamento');
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      toast.error('Erro ao testar treinamento');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header Premium */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Treinamento Premium IA
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure e treine seu agente IA com precisão e sofisticação
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              
              <Button
                variant="outline"
                onClick={testTraining}
                disabled={isTesting}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Testar
              </Button>

              <Button
                onClick={saveTraining}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              >
                {isSaving ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar & Sincronizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Navegação */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Seções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { id: 'basic', label: 'Informações Básicas', icon: Bot },
                  { id: 'training', label: 'Treinamento', icon: Brain },
                  { id: 'rules', label: 'Regras & Limites', icon: Shield },
                  { id: 'actions', label: 'Ações', icon: Target },
                  { id: 'integrations', label: 'Integrações', icon: Zap },
                  { id: 'advanced', label: 'Avançado', icon: Settings }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id as any)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      activeSection === id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Seção: Informações Básicas */}
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-6 h-6 text-blue-600" />
                      Informações do Agente
                    </CardTitle>
                    <CardDescription>
                      Configure as informações básicas do seu agente IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Nome do Agente *</Label>
                        <Input
                          value={agent.name}
                          onChange={(e) => setAgent(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Assistente Thermas"
                          className="h-12 text-lg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Empresa/Organização *</Label>
                        <Input
                          value={agent.company}
                          onChange={(e) => setAgent(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Ex: Grupo Thermas"
                          className="h-12 text-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Descrição</Label>
                      <Textarea
                        value={agent.description}
                        onChange={(e) => setAgent(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o papel e responsabilidades do agente..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Personalidade</Label>
                      <Textarea
                        value={agent.personality}
                        onChange={(e) => setAgent(prev => ({ ...prev, personality: e.target.value }))}
                        placeholder="Como o agente deve se comportar e se comunicar..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Áreas de Expertise</Label>
                      <div className="flex flex-wrap gap-2">
                        {agent.expertise.map((exp, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
                          >
                            {exp}
                            <button
                              onClick={() => setAgent(prev => ({
                                ...prev,
                                expertise: prev.expertise.filter((_, i) => i !== index)
                              }))}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            const newExp = prompt('Nova área de expertise:');
                            if (newExp?.trim()) {
                              setAgent(prev => ({
                                ...prev,
                                expertise: [...prev.expertise, newExp.trim()]
                              }));
                            }
                          }}
                          className="px-3 py-1 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-full text-sm hover:border-blue-500 hover:text-blue-500"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Seção: Treinamento */}
            {activeSection === 'training' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-6 h-6 text-purple-600" />
                      Texto de Treinamento
                    </CardTitle>
                    <CardDescription>
                      Instrua o agente sobre como deve se comportar e responder
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Instruções de Treinamento *</Label>
                      <Textarea
                        value={agent.trainingText}
                        onChange={(e) => setAgent(prev => ({ ...prev, trainingText: e.target.value }))}
                        placeholder="Escreva instruções detalhadas sobre como o agente deve se comportar, responder e interagir com os usuários..."
                        rows={8}
                        className="resize-none text-base leading-relaxed"
                      />
                      <p className="text-xs text-gray-500">
                        {agent.trainingText.length}/2000 caracteres
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Exemplos Práticos</Label>
                      <div className="space-y-3">
                        {agent.examples.map((example, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <span className="text-sm text-gray-500">{index + 1}.</span>
                            <span className="flex-1 text-sm">{example}</span>
                            <button
                              onClick={() => removeExample(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newExample}
                            onChange={(e) => setNewExample(e.target.value)}
                            placeholder="Adicionar novo exemplo..."
                            onKeyPress={(e) => e.key === 'Enter' && addExample()}
                          />
                          <Button onClick={addExample} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Seção: Regras & Limites */}
            {activeSection === 'rules' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-green-600" />
                      Regras e Limites
                    </CardTitle>
                    <CardDescription>
                      Defina regras, boas práticas e limitações do agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Regras e Boas Práticas</Label>
                      <div className="space-y-3">
                        {agent.rules.map((rule, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="flex-1 text-sm">{rule}</span>
                            <button
                              onClick={() => removeRule(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            placeholder="Adicionar nova regra..."
                            onKeyPress={(e) => e.key === 'Enter' && addRule()}
                          />
                          <Button onClick={addRule} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Frases Proibidas</Label>
                      <div className="space-y-3">
                        {agent.forbiddenPhrases.map((phrase, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="flex-1 text-sm">{phrase}</span>
                            <button
                              onClick={() => removeForbiddenPhrase(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newForbiddenPhrase}
                            onChange={(e) => setNewForbiddenPhrase(e.target.value)}
                            placeholder="Adicionar frase proibida..."
                            onKeyPress={(e) => e.key === 'Enter' && addForbiddenPhrase()}
                          />
                          <Button onClick={addForbiddenPhrase} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Exceções</Label>
                        <div className="space-y-3">
                          {agent.exceptions.map((exception, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                            >
                              <span className="flex-1 text-sm">{exception}</span>
                              <button
                                onClick={() => removeException(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              value={newException}
                              onChange={(e) => setNewException(e.target.value)}
                              placeholder="Adicionar exceção..."
                              onKeyPress={(e) => e.key === 'Enter' && addException()}
                            />
                            <Button onClick={addException} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Alertas</Label>
                        <div className="space-y-3">
                          {agent.alerts.map((alert, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                            >
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              <span className="flex-1 text-sm">{alert}</span>
                              <button
                                onClick={() => removeAlert(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              value={newAlert}
                              onChange={(e) => setNewAlert(e.target.value)}
                              placeholder="Adicionar alerta..."
                              onKeyPress={(e) => e.key === 'Enter' && addAlert()}
                            />
                            <Button onClick={addAlert} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Seção: Ações */}
            {activeSection === 'actions' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-indigo-600" />
                      Ações Específicas
                    </CardTitle>
                    <CardDescription>
                      Defina ações que o agente deve executar em situações específicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Ações Automáticas</Label>
                      <div className="space-y-3">
                        {agent.actions.map((action, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                          >
                            <Target className="w-4 h-4 text-indigo-600" />
                            <span className="flex-1 text-sm">{action}</span>
                            <button
                              onClick={() => removeAction(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newAction}
                            onChange={(e) => setNewAction(e.target.value)}
                            placeholder="Adicionar nova ação..."
                            onKeyPress={(e) => e.key === 'Enter' && addAction()}
                          />
                          <Button onClick={addAction} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Seção: Integrações */}
            {activeSection === 'integrations' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-600" />
                      Configurações OpenAI
                    </CardTitle>
                    <CardDescription>
                      Configure os parâmetros de integração com OpenAI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Modelo</Label>
                        <select
                          value={agent.openaiModel}
                          onChange={(e) => setAgent(prev => ({ ...prev, openaiModel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Temperatura</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={agent.openaiTemperature}
                          onChange={(e) => setAgent(prev => ({ ...prev, openaiTemperature: parseFloat(e.target.value) }))}
                          className="text-center"
                        />
                        <p className="text-xs text-gray-500">0.0 = Determinístico, 2.0 = Muito Criativo</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Max Tokens</Label>
                        <Input
                          type="number"
                          min="1"
                          max="4000"
                          value={agent.openaiMaxTokens}
                          onChange={(e) => setAgent(prev => ({ ...prev, openaiMaxTokens: parseInt(e.target.value) }))}
                          className="text-center"
                        />
                        <p className="text-xs text-gray-500">Limite de tokens por resposta</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Seção: Avançado */}
            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-6 h-6 text-gray-600" />
                      Configurações Avançadas
                    </CardTitle>
                    <CardDescription>
                      Configurações adicionais e contexto do agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Contexto Adicional</Label>
                      <Textarea
                        value={agent.context}
                        onChange={(e) => setAgent(prev => ({ ...prev, context: e.target.value }))}
                        placeholder="Informações adicionais, contexto específico ou observações importantes..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Agente Ativo</Label>
                        <p className="text-xs text-gray-500">Habilitar/desabilitar o agente</p>
                      </div>
                      <Switch
                        checked={agent.isActive}
                        onChange={e => setAgent(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Preview do Prompt */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold">Preview do Prompt de Treinamento</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                  {generateTrainingPrompt()}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 