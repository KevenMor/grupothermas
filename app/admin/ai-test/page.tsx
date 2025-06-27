"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Send, TestTube, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TestResult {
  id: string;
  input: string;
  response: string;
  timestamp: string;
  success: boolean;
  trainingContext?: string;
}

export default function AITestPage() {
  const [testMessage, setTestMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedTrainingContext, setSelectedTrainingContext] = useState('all');
  const [customPrompt, setCustomPrompt] = useState('');

  const trainingContexts = [
    { value: 'all', label: 'Todos os Treinamentos' },
    { value: 'atendimento', label: 'Atendimento ao Cliente' },
    { value: 'acoes', label: 'Execução de Ações' },
    { value: 'boaspraticas', label: 'Boas Práticas' },
    { value: 'valores', label: 'Valores e Produtos' },
    { value: 'memoria', label: 'Memória/Histórico' },
    { value: 'delay', label: 'Delay Controlado' }
  ];

  const handleTestAI = async () => {
    if (!testMessage.trim()) {
      toast.error('Digite uma mensagem para testar');
      return;
    }

    setIsTesting(true);
    const testId = Date.now().toString();

    // Adicionar mensagem de teste aos resultados
    const newTest: TestResult = {
      id: testId,
      input: testMessage,
      response: 'Processando...',
      timestamp: new Date().toISOString(),
      success: false,
      trainingContext: selectedTrainingContext
    };

    setTestResults(prev => [newTest, ...prev]);
    setTestMessage('');

    try {
      // Preparar payload com contexto de treinamento
      const payload = {
        phone: '5515999999999', // Número fictício para teste
        message: testMessage,
        trainingContext: selectedTrainingContext,
        customPrompt: customPrompt || undefined
      };

      const response = await fetch('/api/admin/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Atualizar resultado do teste
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? {
              ...test,
              response: result.aiResponse || result.error || 'Erro desconhecido',
              success: response.ok && result.aiResponse,
            }
          : test
      ));

      if (response.ok && result.aiResponse) {
        toast.success('Teste realizado com sucesso!');
      } else {
        toast.error(`Erro no teste: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      console.error('Erro ao testar IA:', error);
      
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? {
              ...test,
              response: `Erro de conectividade: ${error.message}`,
              success: false,
            }
          : test
      ));

      toast.error(`Erro de conectividade: ${error.message}`);
    }

    setIsTesting(false);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const exportTestResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <TestTube className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Testes de IA
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Teste o treinamento da IA com diferentes contextos e cenários
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel de Teste */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Configuração do Teste
              </CardTitle>
              <CardDescription>
                Configure o contexto de treinamento e teste a IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contexto de Treinamento */}
              <div className="space-y-2">
                <Label htmlFor="training-context">Contexto de Treinamento</Label>
                <select
                  value={selectedTrainingContext}
                  onChange={(e) => setSelectedTrainingContext(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {trainingContexts.map(context => (
                    <option key={context.value} value={context.value}>
                      {context.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prompt Personalizado */}
              <div className="space-y-2">
                <Label htmlFor="custom-prompt">Prompt Personalizado (Opcional)</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="Digite um prompt personalizado para o teste..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Deixe vazio para usar o prompt padrão do contexto selecionado
                </p>
              </div>

              {/* Mensagem de Teste */}
              <div className="space-y-2">
                <Label htmlFor="test-message">Mensagem para Testar</Label>
                <Textarea
                  id="test-message"
                  placeholder="Digite a mensagem que você gostaria de testar..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleTestAI} 
                  disabled={isTesting || !testMessage.trim()}
                  className="flex-1"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Executar Teste
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Estatísticas dos Testes
              </CardTitle>
              <CardDescription>
                Resumo dos testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de Testes
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {testResults.filter(t => t.success).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Sucessos
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearTestResults}
                  className="flex-1"
                >
                  Limpar Resultados
                </Button>
                <Button 
                  variant="outline" 
                  onClick={exportTestResults}
                  disabled={testResults.length === 0}
                  className="flex-1"
                >
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultados dos Testes */}
        {testResults.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Histórico de Testes
              </CardTitle>
              <CardDescription>
                Resultados dos testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((test) => (
                  <div 
                    key={test.id} 
                    className={`p-4 rounded-lg border ${
                      test.success 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {test.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className="font-medium">
                          {test.success ? 'Teste Bem-sucedido' : 'Teste Falhou'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(test.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Entrada:
                        </h4>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border text-sm">
                          {test.input}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Resposta da IA:
                        </h4>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border text-sm">
                          {test.response}
                        </div>
                      </div>
                    </div>

                    {test.trainingContext && test.trainingContext !== 'all' && (
                      <div className="mt-3">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          Contexto: {trainingContexts.find(c => c.value === test.trainingContext)?.label}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 