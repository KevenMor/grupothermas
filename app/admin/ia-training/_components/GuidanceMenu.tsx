import React, { useState } from 'react';
import { Edit, Save } from 'lucide-react';

const defaultGuidance = {
  whenToTransfer: [
    'Solicitação explícita do usuário por atendente humano.',
    'Assuntos jurídicos, financeiros sensíveis ou reclamações graves.',
    'Solicitação de cancelamento definitivo de serviços.',
    'Detecção de palavras-chave críticas: "reclamação", "advogado", "procon", "cancelar", "processo", etc.',
    'Dúvidas para as quais o agente não tenha resposta segura.'
  ],
  howToTransfer: [
    'Enviar mensagem gentil informando a transferência.',
    'Registrar o motivo da transferência no log do Firebase.',
    'Aguardar confirmação do atendente humano antes de encerrar a conversa.'
  ],
  general: [
    'Nunca fornecer informações confidenciais.',
    'Ser cordial, objetivo e respeitar limites do agente.',
    'Se não souber responder, pedir um momento para consultar ou transferir conforme necessário.',
    'Registrar situações suspeitas no log para análise posterior.'
  ],
  extras: [
    'Permita testar todas as regras do menu de orientação diretamente no simulador de chat.',
    'Use tags/seções específicas para logs e decisões do agente.',
    'Facilite edição e personalização destas regras para adequação à realidade da empresa.'
  ]
};

export const GuidanceMenu: React.FC = () => {
  const [guidance, setGuidance] = useState(defaultGuidance);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (section: string, idx: number) => {
    setEditing(`${section}-${idx}`);
    setEditValue(guidance[section as keyof typeof guidance][idx]);
  };

  const handleSave = (section: string, idx: number) => {
    setGuidance(prev => ({
      ...prev,
      [section]: prev[section as keyof typeof guidance].map((item, i) => i === idx ? editValue : item)
    }));
    setEditing(null);
    setEditValue('');
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6 sticky top-6">
      <h2 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-200 flex items-center gap-2">
        <Edit className="w-5 h-5" /> Menu de Orientação do Agente
      </h2>
      <div className="space-y-4">
        <Section title="Quando transferir o atendimento:" sectionKey="whenToTransfer" items={guidance.whenToTransfer} editing={editing} editValue={editValue} setEditValue={setEditValue} handleEdit={handleEdit} handleSave={handleSave} />
        <Section title="Como transferir:" sectionKey="howToTransfer" items={guidance.howToTransfer} editing={editing} editValue={editValue} setEditValue={setEditValue} handleEdit={handleEdit} handleSave={handleSave} />
        <Section title="Orientações Gerais:" sectionKey="general" items={guidance.general} editing={editing} editValue={editValue} setEditValue={setEditValue} handleEdit={handleEdit} handleSave={handleSave} />
        <Section title="Extras:" sectionKey="extras" items={guidance.extras} editing={editing} editValue={editValue} setEditValue={setEditValue} handleEdit={handleEdit} handleSave={handleSave} />
      </div>
    </div>
  );
};

const Section = ({ title, sectionKey, items, editing, editValue, setEditValue, handleEdit, handleSave }: any) => (
  <div>
    <h3 className="font-semibold text-blue-600 dark:text-blue-300 mb-1">{title}</h3>
    <ul className="space-y-1">
      {items.map((item: string, idx: number) => (
        <li key={idx} className="flex items-center gap-2">
          {editing === `${sectionKey}-${idx}` ? (
            <>
              <input
                className="flex-1 px-2 py-1 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                autoFocus
              />
              <button className="text-green-600 font-bold" onClick={() => handleSave(sectionKey, idx)}><Save className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <span className="flex-1 text-gray-700 dark:text-gray-100">{item}</span>
              <button className="text-blue-600 font-bold" onClick={() => handleEdit(sectionKey, idx)}><Edit className="w-4 h-4" /></button>
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
); 