"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Brain,
  MessageSquare,
  Package,
  Database,
  Clock,
  Calendar,
  Save,
  Play,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  BookOpen,
  Users,
  Shield,
  Activity,
  Wifi,
  Eye,
  RotateCcw,
  Copy,
  ArrowRight,
  ChevronRight,
  Star,
  Lightbulb,
  TrendingUp,
  BarChart3,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Controle: commit de teste para verificação de push e build

interface TrainingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  content: any;
}

interface TrainingData {
  id: string;
  promptTeaching: string;
  productsServices: ProductService[];
  memoryConfig: MemoryConfig;
  delayConfig: DelayConfig;
  followUpActions: FollowUpAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductService {
  id: string;
  name: string;
  description: string;
  price: string;
  conditions: string;
  isActive: boolean;
}

interface MemoryConfig {
  enabled: boolean;
  maxConversations: number;
  retentionDays: number;
  contextWindow: number;
  priorityTopics: string[];
}

interface DelayConfig {
  enabled: boolean;
  minDelay: number;
  maxDelay: number;
  typingSpeed: number;
  responseVariation: boolean;
}

interface FollowUpAction {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  delayHours: number;
  message: string;
  isActive: boolean;
}

export default function IATrainingPage() {
  // Estado da seção ativa
  const [activeSection, setActiveSection] = useState('prompt');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Estado dos dados de treinamento
  const [trainingData, setTrainingData] = useState<TrainingData>({
    id: 'default',
    promptTeaching: '',
    productsServices: [],
    memoryConfig: {
      enabled: true,
      maxConversations: 10,
      retentionDays: 30,
      contextWindow: 5,
      priorityTopics: []
    },
    delayConfig: {
      enabled: true,
      minDelay: 2,
      maxDelay: 5,
      typingSpeed: 50,
      responseVariation: true
    },
    followUpActions: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Estados para campos dinâmicos
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', conditions: '' });
  const [newTopic, setNewTopic] = useState('');
  const [newFollowUp, setNewFollowUp] = useState({ name: '', description: '', triggerCondition: '', delayHours: 24, message: '' });

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
          setTrainingData(data.agent);
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
        body: JSON.stringify({ agent: trainingData })
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
          agent: trainingData,
          trainingPrompt
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
# Configuração de Treinamento IA - Grupo Thermas

## Prompt de Ensinamento
${trainingData.promptTeaching}

## Produtos e Serviços
${trainingData.productsServices.map(ps => `
- **${ps.name}**: ${ps.description}
  - Preço: ${ps.price}
  - Condições: ${ps.conditions}
`).join('')}

## Configuração de Memória
- Habilitada: ${trainingData.memoryConfig.enabled ? 'Sim' : 'Não'}
- Máximo de conversas: ${trainingData.memoryConfig.maxConversations}
- Retenção: ${trainingData.memoryConfig.retentionDays} dias
- Janela de contexto: ${trainingData.memoryConfig.contextWindow}
- Tópicos prioritários: ${trainingData.memoryConfig.priorityTopics.join(', ')}

## Configuração de Delay
- Habilitado: ${trainingData.delayConfig.enabled ? 'Sim' : 'Não'}
- Delay mínimo: ${trainingData.delayConfig.minDelay}s
- Delay máximo: ${trainingData.delayConfig.maxDelay}s
- Velocidade de digitação: ${trainingData.delayConfig.typingSpeed}ms

## Ações de Follow-up
${trainingData.followUpActions.map(fu => `
- **${fu.name}**: ${fu.description}
  - Gatilho: ${fu.triggerCondition}
  - Delay: ${fu.delayHours}h
  - Mensagem: ${fu.message}
`).join('')}
    `.trim();
  };

  // Funções para produtos/serviços
  const addProduct = () => {
    if (newProduct.name && newProduct.description) {
      setTrainingData(prev => ({
        ...prev,
        productsServices: [...prev.productsServices, {
          id: Date.now().toString(),
          ...newProduct,
          isActive: true
        }]
      }));
      setNewProduct({ name: '', description: '', price: '', conditions: '' });
    }
  };

  const removeProduct = (id: string) => {
    setTrainingData(prev => ({
      ...prev,
      productsServices: prev.productsServices.filter(p => p.id !== id)
    }));
  };

  // Funções para tópicos prioritários
  const addTopic = () => {
    if (newTopic.trim()) {
      setTrainingData(prev => ({
        ...prev,
        memoryConfig: {
          ...prev.memoryConfig,
          priorityTopics: [...prev.memoryConfig.priorityTopics, newTopic.trim()]
        }
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setTrainingData(prev => ({
      ...prev,
      memoryConfig: {
        ...prev.memoryConfig,
        priorityTopics: prev.memoryConfig.priorityTopics.filter((_, i) => i !== index)
      }
    }));
  };

  // Funções para follow-ups
  const addFollowUp = () => {
    if (newFollowUp.name && newFollowUp.description) {
      setTrainingData(prev => ({
        ...prev,
        followUpActions: [...prev.followUpActions, {
          id: Date.now().toString(),
          ...newFollowUp,
          isActive: true
        }]
      }));
      setNewFollowUp({ name: '', description: '', triggerCondition: '', delayHours: 24, message: '' });
    }
  };

  const removeFollowUp = (id: string) => {
    setTrainingData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.filter(f => f.id !== id)
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

  // Seções de treinamento
  const sections: TrainingSection[] = [
    {
      id: 'prompt',
      title: 'Prompt de Ensinamento',
      description: 'Configure o comportamento e personalidade da IA',
      icon: Brain,
      color: 'from-blue-500 to-purple-600',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Instruções de Treinamento *</Label>
            <Textarea
              value={trainingData.promptTeaching}
              onChange={(e) => setTrainingData(prev => ({ ...prev, promptTeaching: e.target.value }))}
              placeholder="Escreva instruções detalhadas sobre como a IA deve se comportar, responder e interagir com os clientes..."
              rows={12}
              className="resize-none text-base leading-relaxed"
            />
            <p className="text-xs text-gray-500">
              {trainingData.promptTeaching.length} caracteres
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Dicas para um Prompt Efetivo
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Defina a personalidade e tom de voz da IA</li>
              <li>• Especifique regras de negócio e limites</li>
              <li>• Inclua exemplos de respostas esperadas</li>
              <li>• Defina como lidar com situações específicas</li>
              <li>• Estabeleça protocolos de escalação</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'products',
      title: 'Produtos/Serviços',
      description: 'Cadastre produtos, preços e condições comerciais',
      icon: Package,
      color: 'from-green-500 to-emerald-600',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome do Produto/Serviço</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Plano Premium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preço</Label>
              <Input
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Ex: R$ 99,90/mês"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os benefícios e características..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Condições Comerciais</Label>
            <Textarea
              value={newProduct.conditions}
              onChange={(e) => setNewProduct(prev => ({ ...prev, conditions: e.target.value }))}
              placeholder="Condições de pagamento, garantias, etc..."
              rows={2}
            />
          </div>
          
          <Button onClick={addProduct} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Produto/Serviço
          </Button>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Produtos/Serviços Cadastrados</h4>
            <div className="space-y-3">
              {trainingData.productsServices.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-green-800 dark:text-green-200">{product.name}</h5>
                    <p className="text-sm text-green-700 dark:text-green-300">{product.description}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">💰 {product.price}</span>
                      <span className="text-green-600 dark:text-green-400">📋 {product.conditions}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'memory',
      title: 'Memória Efetiva',
      description: 'Configure parâmetros de memória e histórico',
      icon: Database,
      color: 'from-purple-500 to-pink-600',
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Memória Habilitada</Label>
              <p className="text-xs text-gray-500">Permitir que a IA lembre de conversas anteriores</p>
            </div>
            <Switch
              checked={trainingData.memoryConfig.enabled}
              onChange={e => setTrainingData(prev => ({
                ...prev,
                memoryConfig: { ...prev.memoryConfig, enabled: e.target.checked }
              }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Máximo de Conversas</Label>
              <Input
                type="number"
                value={trainingData.memoryConfig.maxConversations}
                onChange={(e) => setTrainingData(prev => ({
                  ...prev,
                  memoryConfig: { ...prev.memoryConfig, maxConversations: parseInt(e.target.value) }
                }))}
                min="1"
                max="50"
              />
              <p className="text-xs text-gray-500">Número de conversas para lembrar</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Dias de Retenção</Label>
              <Input
                type="number"
                value={trainingData.memoryConfig.retentionDays}
                onChange={(e) => setTrainingData(prev => ({
                  ...prev,
                  memoryConfig: { ...prev.memoryConfig, retentionDays: parseInt(e.target.value) }
                }))}
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500">Por quanto tempo manter o histórico</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Janela de Contexto</Label>
              <Input
                type="number"
                value={trainingData.memoryConfig.contextWindow}
                onChange={(e) => setTrainingData(prev => ({
                  ...prev,
                  memoryConfig: { ...prev.memoryConfig, contextWindow: parseInt(e.target.value) }
                }))}
                min="1"
                max="20"
              />
              <p className="text-xs text-gray-500">Mensagens anteriores para considerar</p>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Tópicos Prioritários</Label>
            <div className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Adicionar tópico prioritário..."
                onKeyPress={(e) => e.key === 'Enter' && addTopic()}
              />
              <Button onClick={addTopic} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {trainingData.memoryConfig.priorityTopics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm flex items-center gap-2"
                >
                  {topic}
                  <button
                    onClick={() => removeTopic(index)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'delay',
      title: 'Delay entre Mensagens',
      description: 'Configure o tempo entre respostas da IA',
      icon: Clock,
      color: 'from-orange-500 to-red-600',
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Delay Habilitado</Label>
              <p className="text-xs text-gray-500">Simular tempo de digitação humana</p>
            </div>
            <Switch
              checked={trainingData.delayConfig.enabled}
              onChange={e => setTrainingData(prev => ({
                ...prev,
                delayConfig: { ...prev.delayConfig, enabled: e.target.checked }
              }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delay Mínimo (segundos)</Label>
              <Input
                type="number"
                value={trainingData.delayConfig.minDelay}
                onChange={(e) => setTrainingData(prev => ({
                  ...prev,
                  delayConfig: { ...prev.delayConfig, minDelay: parseInt(e.target.value) }
                }))}
                min="0"
                max="30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Delay Máximo (segundos)</Label>
              <Input
                type="number"
                value={trainingData.delayConfig.maxDelay}
                onChange={(e) => setTrainingData(prev => ({
                  ...prev,
                  delayConfig: { ...prev.delayConfig, maxDelay: parseInt(e.target.value) }
                }))}
                min="1"
                max="60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Velocidade de Digitação (ms)</Label>
              <Input
                type="number"
                value={trainingData.delayConfig.typingSpeed}
                onChange={(e) => setTrainingData(prev => ({
                  ...prev,
                  delayConfig: { ...prev.delayConfig, typingSpeed: parseInt(e.target.value) }
                }))}
                min="10"
                max="200"
              />
              <p className="text-xs text-gray-500">Simular digitação em tempo real</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Variação de Resposta</Label>
              <p className="text-xs text-gray-500">Variação natural no tempo de resposta</p>
            </div>
            <Switch
              checked={trainingData.delayConfig.responseVariation}
              onChange={e => setTrainingData(prev => ({
                ...prev,
                delayConfig: { ...prev.delayConfig, responseVariation: e.target.checked }
              }))}
            />
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Configuração Recomendada
            </h4>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Delay mínimo: 2-3 segundos</li>
              <li>• Delay máximo: 5-8 segundos</li>
              <li>• Velocidade de digitação: 50-80ms</li>
              <li>• Variação habilitada para naturalidade</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'followup',
      title: 'Ações de Follow-up',
      description: 'Configure ações automáticas de acompanhamento',
      icon: Calendar,
      color: 'from-indigo-500 to-cyan-600',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome da Ação</Label>
              <Input
                value={newFollowUp.name}
                onChange={(e) => setNewFollowUp(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Follow-up de Vendas"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delay (horas)</Label>
              <Input
                type="number"
                value={newFollowUp.delayHours}
                onChange={(e) => setNewFollowUp(prev => ({ ...prev, delayHours: parseInt(e.target.value) }))}
                min="1"
                max="168"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={newFollowUp.description}
              onChange={(e) => setNewFollowUp(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo desta ação..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Condição Gatilho</Label>
            <Textarea
              value={newFollowUp.triggerCondition}
              onChange={(e) => setNewFollowUp(prev => ({ ...prev, triggerCondition: e.target.value }))}
              placeholder="Ex: Cliente demonstrou interesse em produto X"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mensagem de Follow-up</Label>
            <Textarea
              value={newFollowUp.message}
              onChange={(e) => setNewFollowUp(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Mensagem que será enviada automaticamente..."
              rows={3}
            />
          </div>
          
          <Button onClick={addFollowUp} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Ação de Follow-up
          </Button>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Ações de Follow-up Configuradas</h4>
            <div className="space-y-3">
              {trainingData.followUpActions.map((followUp) => (
                <div
                  key={followUp.id}
                  className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-indigo-800 dark:text-indigo-200">{followUp.name}</h5>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">{followUp.description}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-indigo-600 dark:text-indigo-400">⏰ {followUp.delayHours}h</span>
                      <span className="text-indigo-600 dark:text-indigo-400">🎯 {followUp.triggerCondition}</span>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      💬 {followUp.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFollowUp(followUp.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

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
                  Treinamento IA
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure e treine sua IA para atendimento perfeito
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
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        activeSection === section.id
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <span className="font-medium">{section.title}</span>
                        <p className={`text-xs ${activeSection === section.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {section.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentSection && <currentSection.icon className="w-6 h-6" />}
                  {currentSection?.title}
                </CardTitle>
                <CardDescription>
                  {currentSection?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentSection?.content}
              </CardContent>
            </Card>
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