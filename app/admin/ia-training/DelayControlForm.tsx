import { useEffect, useState } from 'react';

export default function DelayControlForm() {
  const [delay, setDelay] = useState<number>(1.5); // padrão 1.5s
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Firestore client-side (browser)
  const getFirestore = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.firebase?.firestore?.();
    }
    return null;
  };

  // Carregar valor atual ao montar
  useEffect(() => {
    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    db.collection('admin_config').doc('ia_settings').get()
      .then((doc: any) => {
        const val = doc.data()?.responseDelaySeconds;
        if (typeof val === 'number') {
          setDelay(val);
          setLastSaved(val);
        }
      })
      .catch(() => setFeedback('Erro ao carregar delay'))
      .finally(() => setLoading(false));
  }, []);

  // Salvar novo valor
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('admin_config').doc('ia_settings').set({ responseDelaySeconds: delay }, { merge: true });
      setLastSaved(delay);
      setFeedback('Delay salvo com sucesso!');
    } catch {
      setFeedback('Erro ao salvar delay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-md mx-auto flex flex-col gap-4">
      <label className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
        Delay de resposta da IA (segundos)
        <span title="O delay é aplicado em todas as respostas automáticas da IA para garantir naturalidade e evitar bloqueios de API." className="text-blue-500 cursor-help">ℹ️</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="0.1"
          className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          value={delay}
          onChange={e => setDelay(Number(e.target.value))}
          disabled={loading}
        />
        <span className="text-gray-500">segundos</span>
        <button
          type="submit"
          className="ml-4 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >Salvar</button>
      </div>
      {lastSaved !== null && (
        <div className="text-xs text-gray-400">Valor atual salvo: <b>{lastSaved}</b> segundos</div>
      )}
      {feedback && <div className="text-sm text-blue-600 dark:text-blue-300">{feedback}</div>}
    </form>
  );
} 