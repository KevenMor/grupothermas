import { useEffect, useState } from 'react';

interface ValorItem {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
}

export default function ValoresForm() {
  const [valores, setValores] = useState<ValorItem[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPreco, setEditPreco] = useState('');

  // Firestore client-side (browser)
  const getFirestore = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.firebase?.firestore?.();
    }
    return null;
  };

  // Carregar valores ao montar
  useEffect(() => {
    const db = getFirestore();
    if (!db) return;
    setLoading(true);
    db.collection('ia_training_valores')
      .orderBy('createdAt', 'desc')
      .get()
      .then((snap: any) => {
        setValores(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      })
      .catch(() => setFeedback('Erro ao carregar valores'))
      .finally(() => setLoading(false));
  }, []);

  // Adicionar novo valor
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoPreco.trim()) return;
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      const docRef = await db.collection('ia_training_valores').add({ nome: novoNome, descricao: novaDescricao, preco: novoPreco, createdAt: new Date() });
      setValores([{ id: docRef.id, nome: novoNome, descricao: novaDescricao, preco: novoPreco }, ...valores]);
      setNovoNome('');
      setNovaDescricao('');
      setNovoPreco('');
      setFeedback('Valor adicionado!');
    } catch {
      setFeedback('Erro ao adicionar valor');
    } finally {
      setLoading(false);
    }
  };

  // Remover valor
  const handleRemove = async (id: string) => {
    if (!confirm('Remover este valor?')) return;
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('ia_training_valores').doc(id).delete();
      setValores(valores.filter((v) => v.id !== id));
      setFeedback('Valor removido!');
    } catch {
      setFeedback('Erro ao remover valor');
    } finally {
      setLoading(false);
    }
  };

  // Editar valor
  const handleEdit = (id: string) => {
    const valor = valores.find((v) => v.id === id);
    if (!valor) return;
    setEditId(id);
    setEditNome(valor.nome);
    setEditDescricao(valor.descricao);
    setEditPreco(valor.preco);
  };
  const handleEditSave = async () => {
    if (!editId || !editNome.trim() || !editPreco.trim()) return;
    setLoading(true);
    setFeedback(null);
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('ia_training_valores').doc(editId).update({ nome: editNome, descricao: editDescricao, preco: editPreco });
      setValores(valores.map((v) => (v.id === editId ? { ...v, nome: editNome, descricao: editDescricao, preco: editPreco } : v)));
      setEditId(null);
      setEditNome('');
      setEditDescricao('');
      setEditPreco('');
      setFeedback('Valor editado!');
    } catch {
      setFeedback('Erro ao editar valor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-2 mb-6">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          placeholder="Nome do produto/serviço..."
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          placeholder="Descrição (opcional)"
          value={novaDescricao}
          onChange={e => setNovaDescricao(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          className="w-32 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          placeholder="Preço (ex: R$ 199,90)"
          value={novoPreco}
          onChange={e => setNovoPreco(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          disabled={loading || !novoNome.trim() || !novoPreco.trim()}
        >Adicionar</button>
      </form>
      {feedback && <div className="mb-4 text-sm text-blue-600 dark:text-blue-300">{feedback}</div>}
      <ul className="space-y-2">
        {valores.map((v) => (
          <li key={v.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            {editId === v.id ? (
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <input
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  disabled={loading}
                  placeholder="Nome"
                />
                <input
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  value={editDescricao}
                  onChange={e => setEditDescricao(e.target.value)}
                  disabled={loading}
                  placeholder="Descrição"
                />
                <input
                  className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  value={editPreco}
                  onChange={e => setEditPreco(e.target.value)}
                  disabled={loading}
                  placeholder="Preço"
                />
                <button className="text-green-600 font-bold mr-2" onClick={handleEditSave} disabled={loading}>Salvar</button>
                <button className="text-gray-400" onClick={() => setEditId(null)} disabled={loading}>Cancelar</button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
                <span className="flex-1 text-gray-800 dark:text-gray-100 font-semibold">{v.nome}</span>
                <span className="flex-1 text-gray-600 dark:text-gray-300 text-sm">{v.descricao}</span>
                <span className="w-32 text-right text-blue-700 dark:text-blue-300 font-bold">{v.preco}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 font-bold" onClick={() => handleEdit(v.id)} disabled={loading}>Editar</button>
                  <button className="text-red-500 font-bold" onClick={() => handleRemove(v.id)} disabled={loading}>Remover</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {loading && <div className="mt-4 text-gray-400">Carregando...</div>}
      {!loading && valores.length === 0 && <div className="mt-4 text-gray-400">Nenhum valor cadastrado ainda.</div>}
    </div>
  );
} 