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
          trainingPrompt: trainingPrompt || '',
          testMessage: userMsg.content,
          history
        })
      });
      if (!response.ok) {
        throw new Error('Erro ao se comunicar com a IA.');
      }
      const data = await response.json();
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
    <div className="flex flex-col h-[500px] w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
        <img src={agentAvatar || '/whatsapp-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-green-400" />
        <div>
          <div className="font-semibold text-gray-800 dark:text-gray-100">{agentName}</div>
          <div className="text-xs text-green-600 dark:text-green-300">online</div>
        </div>
      </div>
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('/chat-bg.png')] dark:bg-[url('/chat-bg-dark.png')]">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line ${msg.sender === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] px-4 py-2 rounded-2xl shadow bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
              Digitando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Feedback de erro */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 border-t border-red-200 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {/* Aviso de simulação para admin/dev */}
      {simMode && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 text-yellow-800 border-t border-yellow-200 text-xs">
          <Info className="w-4 h-4" /> Modo simulação: integração real com IA indisponível ou falhou.
        </div>
      )}
      {/* Campo de digitação */}
      <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Paperclip className="w-5 h-5 text-gray-400" /></button>
        <textarea
          ref={textareaRef}
          className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none resize-none min-h-[40px] max-h-32"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={isTyping}
          rows={1}
        />
        <button
          className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition"
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 