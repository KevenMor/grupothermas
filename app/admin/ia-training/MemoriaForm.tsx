import { useEffect, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  timestamp: string;
  conversationStatus: string;
  aiEnabled: boolean;
  aiPaused: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  role: 'user' | 'agent' | 'system' | 'ai';
  agentName?: string;
  userName?: string;
}

export default function MemoriaForm() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Firestore client-side (browser)
  const getFirestore = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.firebase?.firestore?.();
    }
    return null;
  };

  // Carregar conversas ao montar
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    try {
      const snapshot = await db.collection('conversations')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      const convs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convs);
    } catch (error) {
      setFeedback('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string) => {
    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    try {
      const snapshot = await db.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();
      
      const msgs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    } catch (error) {
      setFeedback('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  // Buscar conversas
  const handleSearch = async () => {
    if (!searchTerm.trim() && !dateFilter) {
      loadConversations();
      return;
    }

    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    try {
      let query = db.collection('conversations');
      
      if (searchTerm.trim()) {
        // Buscar por nome do cliente ou telefone
        query = query.where('customerName', '>=', searchTerm)
          .where('customerName', '<=', searchTerm + '\uf8ff');
      }
      
      if (dateFilter) {
        const startDate = new Date(dateFilter);
        const endDate = new Date(dateFilter);
        endDate.setDate(endDate.getDate() + 1);
        query = query.where('timestamp', '>=', startDate.toISOString())
          .where('timestamp', '<', endDate.toISOString());
      }
      
      const snapshot = await query.orderBy('timestamp', 'desc').limit(50).get();
      const convs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convs);
    } catch (error) {
      setFeedback('Erro na busca');
    } finally {
      setLoading(false);
    }
  };

  // Selecionar conversa
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  // Formatar data
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Ontem ' + format(date, 'HH:mm');
    }
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm.trim()) return true;
    return conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.customerPhone.includes(searchTerm) ||
           conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          placeholder="Buscar por cliente, telefone ou conteúdo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <input
          type="date"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Buscar
        </button>
        <button
          onClick={loadConversations}
          className="px-6 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700"
        >
          Limpar
        </button>
      </div>

      {feedback && <div className="text-sm text-blue-600 dark:text-blue-300">{feedback}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Conversas */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Conversas ({filteredConversations.length})</h3>
          {loading ? (
            <div className="text-gray-400">Carregando...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id
                      ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                      {conv.customerName}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(conv.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {conv.customerPhone}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                    {conv.lastMessage}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      conv.aiEnabled && !conv.aiPaused
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {conv.aiEnabled && !conv.aiPaused ? 'IA Ativa' : 'Humano'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {conv.conversationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Mensagens */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">
            Histórico {selectedConversation && `- ${selectedConversation.customerName}`}
          </h3>
          {selectedConversation ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900 ml-4'
                      : msg.role === 'ai'
                      ? 'bg-purple-100 dark:bg-purple-900 mr-4'
                      : 'bg-gray-100 dark:bg-gray-700 mr-4'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {msg.role === 'user' ? 'Cliente' : msg.role === 'ai' ? 'IA' : msg.agentName || 'Agente'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  Nenhuma mensagem encontrada
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              Selecione uma conversa para ver o histórico
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 