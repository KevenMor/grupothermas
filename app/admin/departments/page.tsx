'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Building2, Users, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/api'

interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  responsibleAgents?: string[]
}

export default function DepartmentsPage() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  // Carregar departamentos
  const loadDepartments = async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch('/api/admin/departments', {}, user)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      } else {
        toast.error('Erro ao carregar departamentos')
      }
    } catch (error) {
      toast.error('Erro ao carregar departamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  // Salvar departamento
  const saveDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do departamento é obrigatório')
      return
    }

    try {
      const url = editingDepartment 
        ? `/api/admin/departments/${editingDepartment.id}`
        : '/api/admin/departments'
      
      const method = editingDepartment ? 'PUT' : 'POST'
      
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }, user)

      if (response.ok) {
        toast.success(editingDepartment ? 'Departamento atualizado!' : 'Departamento criado!')
        setShowForm(false)
        setEditingDepartment(null)
        setFormData({ name: '', description: '', isActive: true })
        loadDepartments()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar departamento')
      }
    } catch (error) {
      toast.error('Erro ao salvar departamento')
    }
  }

  // Toggle status do departamento
  const toggleDepartmentStatus = async (department: Department) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch(`/api/admin/departments/${department.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...department, isActive: !department.isActive })
      }, user)

      if (response.ok) {
        toast.success(`Departamento ${department.isActive ? 'desativado' : 'ativado'}!`)
        loadDepartments()
      } else {
        toast.error('Erro ao alterar status do departamento')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do departamento')
    }
  }

  // Deletar departamento
  const deleteDepartment = async (department: Department) => {
    if (!confirm(`Tem certeza que deseja excluir o departamento "${department.name}"?`)) {
      return
    }

    try {
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch(`/api/admin/departments/${department.id}`, {
        method: 'DELETE'
      }, user)

      if (response.ok) {
        toast.success('Departamento excluído!')
        loadDepartments()
      } else {
        toast.error('Erro ao excluir departamento')
      }
    } catch (error) {
      toast.error('Erro ao excluir departamento')
    }
  }

  // Abrir formulário para edição
  const openEditForm = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || '',
      isActive: department.isActive
    })
    setShowForm(true)
  }

  // Abrir formulário para criação
  const openCreateForm = () => {
    setEditingDepartment(null)
    setFormData({ name: '', description: '', isActive: true })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando departamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 py-6 px-2 border-b border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gerenciamento de Departamentos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">Configure os departamentos para roteamento inteligente de atendimento</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <div>
            <Button onClick={openCreateForm} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg px-6 py-2">
              <Plus className="w-4 h-4 mr-2" />
              Novo Departamento
            </Button>
          </div>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveDepartment(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Departamento *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Suporte Técnico"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional do departamento"
                    rows={3}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 px-4 py-2"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500 accent-blue-600 h-5 w-5"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                    Departamento ativo
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg px-6 py-2 rounded-lg">
                    {editingDepartment ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Departamentos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id} className="rounded-2xl shadow-md hover:shadow-xl transition-shadow border-0 bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {department.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={department.isActive ? "default" : "secondary"} className="rounded-full px-3 py-1 text-xs">
                      {department.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(department)}
                    className="text-gray-500 hover:text-blue-600 rounded-full"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDepartmentStatus(department)}
                    className="text-gray-500 hover:text-orange-600 rounded-full"
                  >
                    {department.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDepartment(department)}
                    className="text-gray-500 hover:text-red-600 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {department.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {department.description}
                </p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Criado em: {new Date(department.createdAt).toLocaleDateString('pt-BR')}
                {department.updatedAt && (
                  <div>
                    Atualizado em: {new Date(department.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {departments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum departamento cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Crie o primeiro departamento para começar a organizar o atendimento
            </p>
            <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Departamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 