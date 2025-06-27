import React, { useState, useRef } from 'react';
import { Paperclip, Send, Loader2 } from 'lucide-react';

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
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ agentName = 'Clara', agentAvatar, onLog }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    // Simular delay de digitação
    setTimeout(async () => {
      // Aqui será feita a chamada real para a IA
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        content: 'Simulação de resposta da IA (integração real em breve)',
        sender: 'agent',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
      onLog?.({ type: 'sim', userMsg, agentMsg });
    }, 1200 + Math.random() * 1000);
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
      {/* Campo de digitação */}
      <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Paperclip className="w-5 h-5 text-gray-400" /></button>
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={isTyping}
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