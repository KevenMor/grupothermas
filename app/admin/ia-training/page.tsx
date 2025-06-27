"use client";
import { useState } from 'react';
import AtendimentoForm from './AtendimentoForm';
import AcoesForm from './AcoesForm';
import DelayControlForm from './DelayControlForm';
import BoasPraticasForm from './BoasPraticasForm';
import ValoresForm from './ValoresForm';
import MemoriaForm from './MemoriaForm';

const TABS = [
  { key: 'atendimento', label: 'Atendimento' },
  { key: 'acoes', label: 'Ações' },
  { key: 'boaspraticas', label: 'Boas Práticas' },
  { key: 'valores', label: 'Valores' },
  { key: 'memoria', label: 'Memória/Histórico' },
  { key: 'delay', label: 'Delay Controlado' },
];

export default function IATrainingPage() {
  const [tab, setTab] = useState('atendimento');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin IA – Área de Treinamento</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Garanta qualidade, empatia e memória ativa no atendimento com IA.</p>
      </header>
      <main className="flex flex-1">
        {/* Menu lateral */}
        <nav className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`text-left px-4 py-2 rounded-lg font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-800/30'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {/* Conteúdo */}
        <section className="flex-1 p-8">
          {tab === 'atendimento' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Treinamento de Atendimento ao Cliente</h2>
              <p className="text-gray-500 mb-6">Cadastre exemplos de boas práticas, frases acolhedoras e orientações para a IA atuar de forma humana, empática e profissional.</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[200px]">
                <AtendimentoForm />
              </div>
            </div>
          )}
          {tab === 'acoes' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Execução de Ações</h2>
              <p className="text-gray-500 mb-6">Instrua a IA sobre como executar ações práticas: responder dúvidas, encaminhar solicitações, registrar informações e executar procedimentos.</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[200px]">
                <AcoesForm />
              </div>
            </div>
          )}
          {tab === 'boaspraticas' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Personalização e Boas Práticas</h2>
              <p className="text-gray-500 mb-6">Inclua exemplos de frases acolhedoras, abordagens para objeções e estratégias para situações delicadas, sempre personalizando o atendimento.</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[200px]">
                <BoasPraticasForm />
              </div>
            </div>
          )}
          {tab === 'valores' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gestão de Valores</h2>
              <p className="text-gray-500 mb-6">Cadastre, edite e consulte valores de produtos, serviços e itens relacionados. Garanta informações comerciais precisas e atualizadas.</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[200px]">
                <ValoresForm />
              </div>
            </div>
          )}
          {tab === 'memoria' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Memória Ativa e Histórico</h2>
              <p className="text-gray-500 mb-6">A IA terá acesso ao histórico completo de cada cliente, considerando todas as interações anteriores para personalizar o atendimento.</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[200px]">
                <MemoriaForm />
              </div>
            </div>
          )}
          {tab === 'delay' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Delay Controlado</h2>
              <p className="text-gray-500 mb-6">Configure o tempo de delay (em segundos) aplicado em todas as respostas automáticas da IA para garantir naturalidade e evitar bloqueios de API.</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[120px]">
                <DelayControlForm />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
} 