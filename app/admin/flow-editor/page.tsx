"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Save, 
  Play, 
  Settings, 
  Bot, 
  MessageSquare, 
  Zap, 
  Code, 
  Database,
  Eye,
  History,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';

interface FlowBlock {
  id: string;
  type: 'start' | 'ai_response' | 'zapi_action' | 'condition' | 'end';
  position: { x: number; y: number };
  title: string;
  description: string;
  config: {
    openai?: {
      prompt: string;
      temperature: number;
      maxTokens: number;
      systemMessage: string;
      examples: string[];
    };
    zapi?: {
      action: string;
      parameters: Record<string, any>;
      webhook: string;
      timeout: number;
    };
    condition?: {
      type: 'text_match' | 'intent' | 'variable' | 'api_response';
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: string;
      variable: string;
    };
    variables: string[];
    nextBlocks: string[];
  };
  connections: {
    from: string;
    to: string;
    condition?: string;
  }[];
}

interface Flow {
  id: string;
  name: string;
  description: string;
  blocks: FlowBlock[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

type ZapiConfig = { action: string; parameters: Record<string, any>; webhook: string; timeout: number };
type ConditionConfig = { type: 'text_match' | 'intent' | 'variable' | 'api_response'; operator: 'equals' | 'contains' | 'greater_than' | 'less_than'; value: string; variable: string };

export default function FlowEditorPage() {
  const { user } = useAuth();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<FlowBlock | null>(null);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Verificar se usuário é admin
  const isAdmin = user?.role === 'admin';

  // Firestore client-side
  const getFirestore = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.firebase?.firestore?.();
    }
    return null;
  };

  // Carregar fluxos
  useEffect(() => {
    if (!isAdmin) return;
    loadFlows();
  }, [isAdmin]);

  const loadFlows = async () => {
    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    try {
      const snapshot = await db.collection('flow_editor')
        .orderBy('updatedAt', 'desc')
        .get();
      
      const flowsData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setFlows(flowsData);
    } catch (error) {
      setFeedback('Erro ao carregar fluxos');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo fluxo
  const createNewFlow = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const db = getFirestore();
    if (!db) return;
    
    try {
      const newFlow: Flow = {
        id: `flow_${Date.now()}`,
        name: 'Novo Fluxo de Atendimento',
        description: 'Descrição do novo fluxo',
        blocks: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            title: 'Início',
            description: 'Ponto de início do fluxo',
            config: {
              variables: [],
              nextBlocks: []
            },
            connections: []
          }
        ],
        version: 1,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || 'unknown'
      };

      await db.collection('flow_editor').doc(newFlow.id).set(newFlow);
      setFlows([newFlow, ...flows]);
      setSelectedFlow(newFlow);
      setIsEditing(true);
      setFeedback('Novo fluxo criado!');
    } catch (error) {
      setFeedback('Erro ao criar fluxo');
    } finally {
      setLoading(false);
    }
  };

  // Salvar fluxo
  const saveFlow = async () => {
    if (!selectedFlow || !isAdmin) return;
    setLoading(true);
    const db = getFirestore();
    if (!db) return;
    
    try {
      const updatedFlow = {
        ...selectedFlow,
        version: selectedFlow.version + 1,
        updatedAt: new Date().toISOString()
      };
      
      await db.collection('flow_editor').doc(selectedFlow.id).update(updatedFlow);
      setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
      setSelectedFlow(updatedFlow);
      setFeedback('Fluxo salvo com sucesso!');
    } catch (error) {
      setFeedback('Erro ao salvar fluxo');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar bloco
  const addBlock = (type: FlowBlock['type']) => {
    if (!selectedFlow) return;
    
    const newBlock: FlowBlock = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      title: getBlockTitle(type),
      description: getBlockDescription(type),
      config: getDefaultConfig(type),
      connections: []
    };

    const updatedFlow = {
      ...selectedFlow,
      blocks: [...selectedFlow.blocks, newBlock]
    };
    
    setSelectedFlow(updatedFlow);
    setSelectedBlock(newBlock);
  };

  const getBlockTitle = (type: FlowBlock['type']) => {
    switch (type) {
      case 'start': return 'Início';
      case 'ai_response': return 'Resposta IA';
      case 'zapi_action': return 'Ação Z-API';
      case 'condition': return 'Condição';
      case 'end': return 'Fim';
      default: return 'Bloco';
    }
  };

  const getBlockDescription = (type: FlowBlock['type']) => {
    switch (type) {
      case 'start': return 'Ponto de início do fluxo';
      case 'ai_response': return 'Resposta gerada pela IA';
      case 'zapi_action': return 'Ação executada via Z-API';
      case 'condition': return 'Condição de decisão';
      case 'end': return 'Fim do fluxo';
      default: return 'Descrição do bloco';
    }
  };

  const getDefaultConfig = (type: FlowBlock['type']) => {
    const baseConfig = {
      variables: [] as string[],
      nextBlocks: [] as string[]
    };

    switch (type) {
      case 'ai_response':
        return {
          ...baseConfig,
          openai: {
            prompt: '',
            temperature: 0.7,
            maxTokens: 150,
            systemMessage: 'Você é um assistente virtual do Grupo Thermas.',
            examples: [] as string[]
          }
        };
      case 'zapi_action':
        return {
          ...baseConfig,
          zapi: {
            action: 'send_message',
            parameters: {},
            webhook: '',
            timeout: 30
          }
        };
      case 'condition':
        return {
          ...baseConfig,
          condition: {
            type: 'text_match' as 'text_match',
            operator: 'contains' as 'contains',
            value: '',
            variable: ''
          }
        };
      default:
        return baseConfig;
    }
  };

  // Renderizar bloco
  const renderBlock = (block: FlowBlock) => {
    const blockStyles = {
      start: 'bg-green-500 text-white',
      ai_response: 'bg-blue-500 text-white',
      zapi_action: 'bg-purple-500 text-white',
      condition: 'bg-yellow-500 text-black',
      end: 'bg-red-500 text-white'
    };

    const blockIcons = {
      start: <Play className="w-4 h-4" />,
      ai_response: <Bot className="w-4 h-4" />,
      zapi_action: <Zap className="w-4 h-4" />,
      condition: <Code className="w-4 h-4" />,
      end: <Database className="w-4 h-4" />
    };

    return (
      <div
        key={block.id}
        className={`absolute p-4 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-105 ${
          blockStyles[block.type]
        } ${selectedBlock?.id === block.id ? 'ring-2 ring-white ring-offset-2' : ''}`}
        style={{
          left: block.position.x + canvasPosition.x,
          top: block.position.y + canvasPosition.y,
          minWidth: '150px'
        }}
        onClick={() => setSelectedBlock(block)}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - block.position.x, y: e.clientY - block.position.y });
          }
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          {blockIcons[block.type]}
          <span className="font-semibold text-sm">{block.title}</span>
        </div>
        <p className="text-xs opacity-80">{block.description}</p>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Apenas administradores podem acessar o Editor de Fluxograma.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Editor de Fluxograma de Atendimento
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Crie fluxos inteligentes com integração OpenAI e Z-API
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={createNewFlow} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fluxo
            </Button>
            {selectedFlow && (
              <>
                <Button onClick={saveFlow} disabled={loading} variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button disabled={loading} variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Testar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6">
          <Tabs defaultValue="flows" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flows">Fluxos</TabsTrigger>
              <TabsTrigger value="blocks">Blocos</TabsTrigger>
            </TabsList>

            <TabsContent value="flows" className="mt-4">
              <div className="space-y-3">
                {flows.map((flow) => (
                  <Card
                    key={flow.id}
                    className={`cursor-pointer transition-colors ${
                      selectedFlow?.id === flow.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFlow(flow)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{flow.name}</h3>
                        <Badge variant={flow.isActive ? "default" : "secondary"}>
                          {flow.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {flow.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>v{flow.version}</span>
                        <span>{new Date(flow.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="blocks" className="mt-4">
              <div className="space-y-3">
                <Button
                  onClick={() => addBlock('ai_response')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Resposta IA
                </Button>
                <Button
                  onClick={() => addBlock('zapi_action')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Ação Z-API
                </Button>
                <Button
                  onClick={() => addBlock('condition')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Condição
                </Button>
                <Button
                  onClick={() => addBlock('end')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Fim
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="w-full h-full bg-gray-100 dark:bg-gray-800 relative"
            onMouseMove={(e) => {
              if (isDragging && selectedBlock) {
                const newPosition = {
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y
                };
                const updatedBlock = { ...selectedBlock, position: newPosition };
                const updatedBlocks = selectedFlow?.blocks.map(b => 
                  b.id === selectedBlock.id ? updatedBlock : b
                );
                if (selectedFlow && updatedBlocks) {
                  setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                  setSelectedBlock(updatedBlock);
                }
              }
            }}
            onMouseUp={() => setIsDragging(false)}
          >
            {selectedFlow?.blocks.map(renderBlock)}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedBlock && (
          <div className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Propriedades</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedBlock(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  value={selectedBlock.title}
                  onChange={(e) => {
                    const updatedBlock = { ...selectedBlock, title: e.target.value };
                    setSelectedBlock(updatedBlock);
                    if (selectedFlow) {
                      const updatedBlocks = selectedFlow.blocks.map(b => 
                        b.id === selectedBlock.id ? updatedBlock : b
                      );
                      setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Textarea
                  value={selectedBlock.description}
                  onChange={(e) => {
                    const updatedBlock = { ...selectedBlock, description: e.target.value };
                    setSelectedBlock(updatedBlock);
                    if (selectedFlow) {
                      const updatedBlocks = selectedFlow.blocks.map(b => 
                        b.id === selectedBlock.id ? updatedBlock : b
                      );
                      setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                    }
                  }}
                  rows={3}
                />
              </div>

              {/* Configurações específicas por tipo */}
              {selectedBlock.type === 'ai_response' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prompt da IA</label>
                    <Textarea
                      value={selectedBlock.config.openai?.prompt || ''}
                      onChange={(e) => {
                        const prevOpenai = selectedBlock.config.openai as Partial<{ prompt: string; temperature: number; maxTokens: number; systemMessage: string; examples: string[]; }> || {};
                        const updatedBlock = {
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            openai: {
                              prompt: e.target.value,
                              temperature: prevOpenai.temperature ?? 0.7,
                              maxTokens: prevOpenai.maxTokens ?? 150,
                              systemMessage: prevOpenai.systemMessage ?? 'Você é um assistente virtual do Grupo Thermas.',
                              examples: prevOpenai.examples ?? []
                            }
                          }
                        };
                        setSelectedBlock(updatedBlock);
                        if (selectedFlow) {
                          const updatedBlocks = selectedFlow.blocks.map(b =>
                            b.id === selectedBlock.id ? updatedBlock : b
                          );
                          setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                        }
                      }}
                      rows={4}
                      placeholder="Digite o prompt para a IA..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Temperatura</label>
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={selectedBlock.config.openai?.temperature ?? 0.7}
                      onChange={(e) => {
                        const temp = parseFloat(e.target.value);
                        const prevOpenai = selectedBlock.config.openai as Partial<{ prompt: string; temperature: number; maxTokens: number; systemMessage: string; examples: string[]; }> || {};
                        const updatedBlock = {
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            openai: {
                              prompt: prevOpenai.prompt ?? '',
                              temperature: isNaN(temp) ? 0.7 : temp,
                              maxTokens: prevOpenai.maxTokens ?? 150,
                              systemMessage: prevOpenai.systemMessage ?? 'Você é um assistente virtual do Grupo Thermas.',
                              examples: prevOpenai.examples ?? []
                            }
                          }
                        };
                        setSelectedBlock(updatedBlock);
                        if (selectedFlow) {
                          const updatedBlocks = selectedFlow.blocks.map(b =>
                            b.id === selectedBlock.id ? updatedBlock : b
                          );
                          setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === 'zapi_action' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ação Z-API</label>
                    <Select
                      value={selectedBlock.config.zapi?.action || 'send_message'}
                      onChange={e => {
                        const value = e.target.value;
                        const prevZapi = selectedBlock.config.zapi as Partial<ZapiConfig> || {};
                        const updatedBlock = {
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            zapi: {
                              action: value,
                              parameters: prevZapi.parameters !== undefined ? prevZapi.parameters : {},
                              webhook: prevZapi.webhook !== undefined ? prevZapi.webhook : '',
                              timeout: prevZapi.timeout !== undefined ? prevZapi.timeout : 30
                            }
                          }
                        };
                        setSelectedBlock(updatedBlock);
                        if (selectedFlow) {
                          const updatedBlocks = selectedFlow.blocks.map(b =>
                            b.id === selectedBlock.id ? updatedBlock : b
                          );
                          setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                        }
                      }}
                    >
                      <option value="send_message">Enviar Mensagem</option>
                      <option value="send_file">Enviar Arquivo</option>
                      <option value="get_status">Consultar Status</option>
                      <option value="webhook">Webhook Customizado</option>
                    </Select>
                  </div>
                </div>
              )}

              {selectedBlock.type === 'condition' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Condição</label>
                    <Select
                      value={selectedBlock.config.condition?.type || 'text_match'}
                      onChange={e => {
                        const value = e.target.value as 'text_match' | 'intent' | 'variable' | 'api_response';
                        const prevCondition = selectedBlock.config.condition as Partial<ConditionConfig> || {};
                        const updatedBlock = {
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            condition: {
                              type: value,
                              operator: prevCondition.operator ?? 'contains',
                              value: prevCondition.value ?? '',
                              variable: prevCondition.variable ?? ''
                            }
                          }
                        };
                        setSelectedBlock(updatedBlock);
                        if (selectedFlow) {
                          const updatedBlocks = selectedFlow.blocks.map(b =>
                            b.id === selectedBlock.id ? updatedBlock : b
                          );
                          setSelectedFlow({ ...selectedFlow, blocks: updatedBlocks });
                        }
                      }}
                    >
                      <option value="text_match">Comparação de Texto</option>
                      <option value="intent">Intenção do Usuário</option>
                      <option value="variable">Variável</option>
                      <option value="api_response">Resposta de API</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
} 