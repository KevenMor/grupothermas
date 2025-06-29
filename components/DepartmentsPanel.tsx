import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Plus, Edit, Trash2, Building } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  isActive: boolean;
}

export default function DepartmentsPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', isActive: true });
  const [loading, setLoading] = useState(false);

  // Carregar departamentos em tempo real
  useEffect(() => {
    const q = query(collection(db, 'departments'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setDepartments(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Department, 'id'>) }))
      );
    });
    return () => unsub();
  }, []);

  // Filtro de pesquisa
  const filtered = useMemo(() => {
    return departments.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [departments, search]);

  // Abrir modal para novo ou edição
  const openModal = (dept?: Department) => {
    if (dept) {
      setEditDept(dept);
      setForm({ name: dept.name, isActive: dept.isActive });
    } else {
      setEditDept(null);
      setForm({ name: '', isActive: true });
    }
    setModalOpen(true);
  };

  // Salvar departamento (novo ou edição)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editDept) {
        await updateDoc(doc(db, 'departments', editDept.id), form);
      } else {
        await addDoc(collection(db, 'departments'), form);
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Excluir departamento
  const handleDelete = async (dept: Department) => {
    if (window.confirm(`Excluir o departamento "${dept.name}"?`)) {
      await deleteDoc(doc(db, 'departments', dept.id));
    }
  };

  // Trocar status
  const handleToggleStatus = async (dept: Department) => {
    await updateDoc(doc(db, 'departments', dept.id), { isActive: !dept.isActive });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-600" /> Departamentos
        </h2>
        <Button onClick={() => openModal()} className="flex gap-2">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>
      <div className="mb-4 flex justify-between items-center gap-2">
        <Input
          placeholder="Pesquisar departamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Opções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400 py-8">
                  Nenhum departamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={dept.isActive}
                    onChange={() => handleToggleStatus(dept)}
                  />
                  <span className={
                    dept.isActive
                      ? 'ml-2 text-green-600 font-semibold'
                      : 'ml-2 text-gray-400 font-semibold'
                  }>
                    {dept.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => openModal(dept)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(dept)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDept ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Departamento *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <span>{form.isActive ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {editDept ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 