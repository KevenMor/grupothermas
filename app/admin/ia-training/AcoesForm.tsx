import { useEffect, useState } from 'react';

interface ExemploAcao {
  id: string;
  texto: string;
}

export default function AcoesForm() {
  const [exemplos, setExemplos] = useState<ExemploAcao[]>([]);
  const [novoExemplo, setNovoExemplo] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState('');

  // Firestore client-side (browser)
  const getFirestore = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.firebase?.firestore?.();
    }
    return null;
  };

  // Carregar exemplos ao montar
  useEffect(() => {
    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    db.collection('ia_training_acoes')
      .orderBy('createdAt', 'desc')
      .get()
      .then((snap: any) => {
        setExemplos(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      })
      .catch(() => setFeedback('Erro ao carregar exemplos'))
      .finally(() => setLoading(false));
  }, []);

  // Adicionar novo exemplo
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoExemplo.trim()) return;
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      const docRef = await db.collection('ia_training_acoes').add({ texto: novoExemplo, createdAt: new Date() });
      setExemplos([{ id: docRef.id, texto: novoExemplo }, ...exemplos]);
      setNovoExemplo('');
      setFeedback('Exemplo adicionado!');
    } catch {
      setFeedback('Erro ao adicionar exemplo');
    } finally {
      setLoading(false);
    }
  };

  // Remover exemplo
  const handleRemove = async (id: string) => {
    if (!confirm('Remover este exemplo?')) return;
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('ia_training_acoes').doc(id).delete();
      setExemplos(exemplos.filter((ex) => ex.id !== id));
      setFeedback('Exemplo removido!');
    } catch {
      setFeedback('Erro ao remover exemplo');
    } finally {
      setLoading(false);
    }
  };

  // Editar exemplo
  const handleEdit = async (id: string) => {
    setEditId(id);
    setEditTexto(exemplos.find((ex) => ex.id === id)?.texto || '');
  };
  const handleEditSave = async () => {
    if (!editId || !editTexto.trim()) return;
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('ia_training_acoes').doc(editId).update({ texto: editTexto });
      setExemplos(exemplos.map((ex) => (ex.id === editId ? { ...ex, texto: editTexto } : ex)));
      setEditId(null);
      setEditTexto('');
      setFeedback('Exemplo editado!');
    } catch {
      setFeedback('Erro ao editar exemplo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          placeholder="Exemplo de ação prática..."
          value={novoExemplo}
          onChange={e => setNovoExemplo(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          disabled={loading || !novoExemplo.trim()}
        >Adicionar</button>
      </form>
      {feedback && <div className="mb-4 text-sm text-blue-600 dark:text-blue-300">{feedback}</div>}
      <ul className="space-y-3">
        {exemplos.map((ex) => (
          <li key={ex.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
            {editId === ex.id ? (
              <>
                <input
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 mr-2"
                  value={editTexto}
                  onChange={e => setEditTexto(e.target.value)}
                  disabled={loading}
                />
                <button className="text-green-600 font-bold mr-2" onClick={handleEditSave} disabled={loading}>Salvar</button>
                <button className="text-gray-400" onClick={() => setEditId(null)} disabled={loading}>Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-gray-800 dark:text-gray-100">{ex.texto}</span>
                <button className="text-blue-600 font-bold ml-4" onClick={() => handleEdit(ex.id)} disabled={loading}>Editar</button>
                <button className="text-red-500 font-bold ml-2" onClick={() => handleRemove(ex.id)} disabled={loading}>Remover</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {loading && <div className="mt-4 text-gray-400">Carregando...</div>}
      {!loading && exemplos.length === 0 && <div className="mt-4 text-gray-400">Nenhum exemplo cadastrado ainda.</div>}
    </div>
  );
} 