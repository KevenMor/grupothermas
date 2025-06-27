import React, { useState, useRef } from 'react';
import { Paperclip, Send, Loader2, AlertCircle, Info } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

interface ChatSimulatorProps {
  agentName?: string;
  agentAvatar?: string;
  onLog?: (log: any) => void;
  trainingPrompt?: string;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ agentName = 'Clara', agentAvatar, onLog, trainingPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simMode, setSimMode] = useState(false); // true se integração real falhar
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expansão automática do textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Montar histórico para enviar ao backend
    const history = [...messages, userMsg].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }));

    try {
      // Chamada real para a IA
      const response = await fetch('/api/admin/test-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingPrompt: trainingPrompt || 'Treinamento não informado',
          testMessage: userMsg.content || 'Mensagem não informada',
          history
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Erro ao se comunicar com a IA.');
        setIsTyping(false);
        return;
      }
      if (!data.response) {
        setError('A IA não retornou resposta. Verifique o treinamento ou tente novamente.');
        setIsTyping(false);
        return;
      }
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        content: data.response,
        sender: 'agent',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
      onLog?.({ type: 'ia', userMsg, agentMsg, log: data });
    } catch (err: any) {
      setError('Falha na integração com a IA. Modo simulação ativado.');
      setSimMode(true);
      // Fallback: simulação
      setTimeout(() => {
        const agentMsg: Message = {
          id: `agent-${Date.now()}`,
          content: 'Simulação de resposta da IA (integração real falhou)',
          sender: 'agent',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, agentMsg]);
        setIsTyping(false);
        onLog?.({ type: 'sim', userMsg, agentMsg });
      }, 1200 + Math.random() * 1000);
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[650px] w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header com avatar centralizado */}
      <div className="flex flex-col items-center justify-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
        <img src="/ia-avatar.svg" alt="avatar" className="w-16 h-16 rounded-full border-4 border-green-300 shadow-md bg-white -mt-8" />
        <div className="text-center">
          <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{agentName}</div>
          <div className="text-xs text-green-600 dark:text-green-300 font-medium">online</div>
        </div>
      </div>
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('/chat-bg.png')] bg-cover dark:bg-[url('/chat-bg.png')]">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-5 py-3 rounded-3xl shadow-md text-base whitespace-pre-line transition-all duration-150 ${msg.sender === 'user' ? 'bg-green-500 text-white rounded-br-md' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-gray-800'}`}
              style={{ marginLeft: msg.sender === 'user' ? 'auto' : 0, marginRight: msg.sender === 'agent' ? 'auto' : 0 }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] px-5 py-3 rounded-3xl shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
              Digitando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Feedback de erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border-t border-red-200 text-sm rounded-b-xl shadow-inner">
          <AlertCircle className="w-5 h-5" />
          <span>
            {error} <br />
            <span className="text-xs text-red-500">Dica: verifique a API Key, conexão ou revise o treinamento.</span>
          </span>
        </div>
      )}
      {/* Aviso de simulação para admin/dev */}
      {simMode && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 text-yellow-800 border-t border-yellow-200 text-xs rounded-b-xl shadow-inner">
          <Info className="w-4 h-4" />
          Modo simulação: integração real com IA indisponível ou falhou.
        </div>
      )}
      {/* Campo de digitação aprimorado */}
      <div className="flex items-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Paperclip className="w-5 h-5 text-gray-400" /></button>
        <textarea
          ref={textareaRef}
          className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none resize-none min-h-[40px] max-h-32 shadow-inner"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={isTyping}
          rows={1}
        />
        <button
          className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition shadow-md"
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 