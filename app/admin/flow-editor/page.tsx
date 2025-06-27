"use client";
import { useState, useEffect, useRef } from 'react';
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
  Pause, 
  Trash2, 
  Plus, 
  ArrowRight, 
  GitBranch, 
  Database, 
  Zap, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  History,
  Download,
  Upload,
  Eye,
  Edit,
  Copy,
  RotateCcw,
  Activity,
  Users,
  Target,
  Lightbulb,
  BookOpen,
  Brain,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// Tipos para o fluxograma premium
interface FlowBlock {
  id: string;
  type: 'start' | 'ai_response' | 'zapi_action' | 'condition' | 'delay' | 'end';
  position: { x: number; y: number };
  data: {
    name: string;
    description: string;
    aiAgentName?: string;
    companyName?: string;
    trainingText?: string;
    examples?: string[];
    forbiddenPhrases?: string[];
    exceptions?: string[];
    actions?: string[];
    variables?: Record<string, string>;
    conditions?: string[];
    delayMs?: number;
    zapiEndpoint?: string;
    zapiParams?: Record<string, any>;
    openaiPrompt?: string;
    openaiModel?: string;
    openaiTemperature?: number;
    openaiMaxTokens?: number;
  };
  connections: string[];
}

interface FlowAgent {
  id: string;
  name: string;
  company: string;
  description: string;
  personality: string;
  expertise: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface FlowVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  blocks: FlowBlock[];
  agent: FlowAgent;
  createdAt: string;
  createdBy: string;
  isPublished: boolean;
}

interface FlowLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'restore';
  version: string;
  timestamp: string;
  user: string;
  details: string;
}

export default function FlowEditorPremium() {
  // Estados principais
  const [blocks, setBlocks] = useState<FlowBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<FlowBlock | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Estados do agente IA
  const [currentAgent, setCurrentAgent] = useState<FlowAgent>({
    id: 'default',
    name: 'Assistente Thermas',
    company: 'Grupo Thermas',
    description: 'Assistente virtual especializado em atendimento ao cliente',
    personality: 'Empático, profissional e eficiente',
    expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  });

  // Estados de versão e histórico
  const [currentVersion, setCurrentVersion] = useState<FlowVersion | null>(null);
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [logs, setLogs] = useState<FlowLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Estados de interface
  const [activeTab, setActiveTab] = useState<'editor' | 'agent' | 'training' | 'versions' | 'logs'>('editor');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Inicialização
  useEffect(() => {
    loadFlowData();
    loadVersions();
    loadLogs();
  }, []);

  // Carregar dados do Firebase
  const loadFlowData = async () => {
    try {
      const response = await fetch('/api/admin/flow-data');
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks || []);
        setCurrentAgent(data.agent || currentAgent);
        setCurrentVersion(data.currentVersion);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do fluxo:', error);
      toast.error('Erro ao carregar dados do fluxo');
    }
  };

  const loadVersions = async () => {
    try {
      const response = await fetch('/api/admin/flow-versions');
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/flow-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  // Salvar no Firebase
  const saveFlow = async (isPublish = false) => {
    setIsSaving(true);
    try {
      const flowData = {
        blocks,
        agent: currentAgent,
        version: currentVersion,
        isPublish
      };

      const response = await fetch('/api/admin/flow-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData)
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentVersion(result.version);
        toast.success(isPublish ? 'Fluxo publicado com sucesso!' : 'Fluxo salvo com sucesso!');
        
        // Atualizar logs
        await loadLogs();
        await loadVersions();
      } else {
        throw new Error('Erro ao salvar fluxo');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Premium */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Editor de Fluxograma Premium
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentAgent.name} • {currentAgent.company}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAgentModal(true)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Configurar Agente
            </Button>
            
            <Button
              variant="outline"
              onClick={() => saveFlow(false)}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </Button>

            <Button
              onClick={() => saveFlow(true)}
              disabled={isPublishing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600"
            >
              {isPublishing ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Publicar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar de Ferramentas */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[
                { id: 'editor', label: 'Editor', icon: Edit },
                { id: 'agent', label: 'Agente', icon: Bot },
                { id: 'training', label: 'Treino', icon: Brain },
                { id: 'versions', label: 'Versões', icon: History },
                { id: 'logs', label: 'Logs', icon: Activity }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Conteúdo da Tab */}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Blocos Disponíveis</h3>
                
                <div className="space-y-2">
                  {[
                    { type: 'start', label: 'Início', icon: Play, color: 'bg-green-500' },
                    { type: 'ai_response', label: 'Resposta IA', icon: Bot, color: 'bg-blue-500' },
                    { type: 'zapi_action', label: 'Ação Z-API', icon: Zap, color: 'bg-purple-500' },
                    { type: 'condition', label: 'Condição', icon: GitBranch, color: 'bg-yellow-500' },
                    { type: 'delay', label: 'Delay', icon: Clock, color: 'bg-orange-500' },
                    { type: 'end', label: 'Fim', icon: CheckCircle, color: 'bg-red-500' }
                  ].map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => {
                        const newBlock: FlowBlock = {
                          id: `block-${Date.now()}`,
                          type: type as any,
                          position: { x: 100, y: 100 },
                          data: {
                            name: `Novo ${type.replace('_', ' ')}`,
                            description: '',
                            aiAgentName: currentAgent.name,
                            companyName: currentAgent.company,
                            trainingText: '',
                            examples: [],
                            forbiddenPhrases: [],
                            exceptions: [],
                            actions: [],
                            variables: {},
                            conditions: [],
                            delayMs: 1000,
                            zapiEndpoint: '',
                            zapiParams: {},
                            openaiPrompt: '',
                            openaiModel: 'gpt-4',
                            openaiTemperature: 0.7,
                            openaiMaxTokens: 1000
                          },
                          connections: []
                        };
                        setBlocks(prev => [...prev, newBlock]);
                        setSelectedBlock(newBlock);
                        toast.success('Bloco criado com sucesso!');
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all ${color} text-white`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'agent' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configuração do Agente</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Nome do Agente</Label>
                    <Input
                      value={currentAgent.name}
                      onChange={(e) => setCurrentAgent(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Empresa</Label>
                    <Input
                      value={currentAgent.company}
                      onChange={(e) => setCurrentAgent(prev => ({ ...prev, company: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Personalidade</Label>
                    <Textarea
                      value={currentAgent.personality}
                      onChange={(e) => setCurrentAgent(prev => ({ ...prev, personality: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'versions' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Versões</h3>
                
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{version.name}</span>
                        {version.isPublished && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{version.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Logs de Atividade</h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 border border-gray-200 dark:border-gray-600 rounded text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas do Fluxograma */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full bg-gray-100 dark:bg-gray-900 relative"
          >
            {/* Grid de fundo */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* Blocos */}
            {blocks.map((block) => {
              const isSelected = selectedBlock?.id === block.id;
              
              const getBlockIcon = () => {
                switch (block.type) {
                  case 'start': return <Play className="w-5 h-5" />;
                  case 'ai_response': return <Bot className="w-5 h-5" />;
                  case 'zapi_action': return <Zap className="w-5 h-5" />;
                  case 'condition': return <GitBranch className="w-5 h-5" />;
                  case 'delay': return <Clock className="w-5 h-5" />;
                  case 'end': return <CheckCircle className="w-5 h-5" />;
                  default: return <FileText className="w-5 h-5" />;
                }
              };

              const getBlockColor = () => {
                switch (block.type) {
                  case 'start': return 'bg-green-500';
                  case 'ai_response': return 'bg-blue-500';
                  case 'zapi_action': return 'bg-purple-500';
                  case 'condition': return 'bg-yellow-500';
                  case 'delay': return 'bg-orange-500';
                  case 'end': return 'bg-red-500';
                  default: return 'bg-gray-500';
                }
              };

              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    left: block.position.x,
                    top: block.position.y,
                    transform: `scale(${zoom})`,
                    cursor: 'grab',
                    zIndex: isSelected ? 10 : 1
                  }}
                  className={`
                    w-48 p-4 rounded-lg shadow-lg border-2 transition-all
                    ${getBlockColor()} text-white
                    ${isSelected ? 'border-blue-400 shadow-xl' : 'border-transparent'}
                    hover:shadow-xl hover:scale-105
                  `}
                  onClick={() => setSelectedBlock(block)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getBlockIcon()}
                    <span className="font-semibold text-sm">{block.data.name}</span>
                  </div>
                  <p className="text-xs opacity-90">{block.data.description || 'Sem descrição'}</p>
                  
                  {/* Indicadores de configuração */}
                  <div className="mt-2 flex gap-1">
                    {block.data.trainingText && <BookOpen className="w-3 h-3" />}
                    {Array.isArray(block.data.examples) && block.data.examples.length > 0 && <Lightbulb className="w-3 h-3" />}
                    {Array.isArray(block.data.actions) && block.data.actions.length > 0 && <Target className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}

            {/* Instruções quando não há blocos */}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Comece criando seu fluxograma</h3>
                  <p className="text-sm">Arraste blocos da barra lateral para começar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Painel de Propriedades */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          {selectedBlock && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Propriedades do Bloco
                </CardTitle>
                <CardDescription>
                  Configure o comportamento e treinamento do bloco
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações básicas */}
                <div className="space-y-2">
                  <Label>Nome do Bloco</Label>
                  <Input
                    value={selectedBlock.data.name}
                    onChange={(e) => {
                      setBlocks(prev => prev.map(block => 
                        block.id === selectedBlock.id 
                          ? { ...block, data: { ...block.data, name: e.target.value } }
                          : block
                      ));
                    }}
                    placeholder="Nome do bloco..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={selectedBlock.data.description}
                    onChange={(e) => {
                      setBlocks(prev => prev.map(block => 
                        block.id === selectedBlock.id 
                          ? { ...block, data: { ...block.data, description: e.target.value } }
                          : block
                      ));
                    }}
                    placeholder="Descrição do que este bloco faz..."
                    rows={2}
                  />
                </div>

                {/* Configurações específicas por tipo */}
                {selectedBlock.type === 'ai_response' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Prompt de Treinamento</Label>
                      <Textarea
                        value={selectedBlock.data.trainingText || ''}
                        onChange={(e) => {
                          setBlocks(prev => prev.map(block => 
                            block.id === selectedBlock.id 
                              ? { ...block, data: { ...block.data, trainingText: e.target.value } }
                              : block
                          ));
                        }}
                        placeholder="Como a IA deve se comportar neste momento..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Modelo OpenAI</Label>
                      <select 
                        value={selectedBlock.data.openaiModel || 'gpt-4'}
                        onChange={(e) => {
                          setBlocks(prev => prev.map(block => 
                            block.id === selectedBlock.id 
                              ? { ...block, data: { ...block.data, openaiModel: e.target.value } }
                              : block
                          ));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Temperatura</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={selectedBlock.data.openaiTemperature || 0.7}
                          onChange={(e) => {
                            setBlocks(prev => prev.map(block => 
                              block.id === selectedBlock.id 
                                ? { ...block, data: { ...block.data, openaiTemperature: parseFloat(e.target.value) } }
                                : block
                            ));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Tokens</Label>
                        <Input
                          type="number"
                          min="1"
                          max="4000"
                          value={selectedBlock.data.openaiMaxTokens || 1000}
                          onChange={(e) => {
                            setBlocks(prev => prev.map(block => 
                              block.id === selectedBlock.id 
                                ? { ...block, data: { ...block.data, openaiMaxTokens: parseInt(e.target.value) } }
                                : block
                            ));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'zapi_action' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Endpoint Z-API</Label>
                      <Input
                        value={selectedBlock.data.zapiEndpoint || ''}
                        onChange={(e) => {
                          setBlocks(prev => prev.map(block => 
                            block.id === selectedBlock.id 
                              ? { ...block, data: { ...block.data, zapiEndpoint: e.target.value } }
                              : block
                          ));
                        }}
                        placeholder="https://api.z-api.io/..."
                      />
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'delay' && (
                  <div className="space-y-2">
                    <Label>Delay (milissegundos)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={selectedBlock.data.delayMs || 1000}
                      onChange={(e) => {
                        setBlocks(prev => prev.map(block => 
                          block.id === selectedBlock.id 
                            ? { ...block, data: { ...block.data, delayMs: parseInt(e.target.value) } }
                            : block
                        ));
                      }}
                    />
                  </div>
                )}

                {/* Ações */}
                <div className="space-y-2">
                  <Label>Ações Específicas</Label>
                  <Textarea
                    value={selectedBlock.data.actions?.join('\n') || ''}
                    onChange={(e) => {
                      setBlocks(prev => prev.map(block => 
                        block.id === selectedBlock.id 
                          ? { ...block, data: { ...block.data, actions: e.target.value.split('\n').filter(Boolean) } }
                          : block
                      ));
                    }}
                    placeholder="Uma ação por linha..."
                    rows={3}
                  />
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBlocks(prev => prev.filter(block => block.id !== selectedBlock.id));
                      setSelectedBlock(null);
                      toast.success('Bloco removido com sucesso!');
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 