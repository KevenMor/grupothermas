'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserProfile, Department, Permission, USER_ROLES } from '@/lib/models'
import { Plus, Search, Edit, Trash2, Filter, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    role: '',
    permissions: [] as string[],
    isActive: true
  })

  // Carregar dados iniciais
  useEffect(() => {
    loadUsers()
    loadDepartments()
    loadPermissions()
  }, [currentPage, searchTerm, selectedDepartment, selectedStatus])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedDepartment && { departmentId: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      })

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Erro ao carregar usuários')

      const data = await response.json()
      setUsers(data.data.data)
      setTotalPages(data.data.totalPages)
      setTotalUsers(data.data.total)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Erro ao carregar departamentos')

      const data = await response.json()
      setDepartments(data.data.data)
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Erro ao carregar permissões')

      const data = await response.json()
      setPermissions(data.data)
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'
      
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar usuário')
      }

      const data = await response.json()
      toast.success(data.message || 'Usuário salvo com sucesso')
      
      setIsDialogOpen(false)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário')
    }
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      departmentId: user.departmentId,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Erro ao desativar usuário')

      toast.success('Usuário desativado com sucesso')
      loadUsers()
    } catch (error) {
      console.error('Erro ao desativar usuário:', error)
      toast.error('Erro ao desativar usuário')
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      departmentId: '',
      role: '',
      permissions: [],
      isActive: true
    })
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      [USER_ROLES.ADMIN]: 'Administrador',
      [USER_ROLES.GERENTE]: 'Gerente',
      [USER_ROLES.ATENDIMENTO]: 'Atendimento',
      [USER_ROLES.COMERCIAL]: 'Comercial',
      [USER_ROLES.FINANCEIRO]: 'Financeiro'
    }
    return roleLabels[role] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      [USER_ROLES.ADMIN]: 'bg-red-100 text-red-800',
      [USER_ROLES.GERENTE]: 'bg-blue-100 text-blue-800',
      [USER_ROLES.ATENDIMENTO]: 'bg-green-100 text-green-800',
      [USER_ROLES.COMERCIAL]: 'bg-yellow-100 text-yellow-800',
      [USER_ROLES.FINANCEIRO]: 'bg-purple-100 text-purple-800'
    }
    return roleColors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários, permissões e departamentos</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função/Perfil *</Label>
                  <Select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="">Selecione a função</option>
                    {Object.entries(USER_ROLES).map(([key, value]) => (
                      <option key={value} value={value}>{getRoleLabel(value)}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Usuário Ativo</Label>
              </div>
              {/* Departamento */}
              <div>
                <Label htmlFor="department">Departamento *</Label>
                <Select
                  value={formData.departmentId}
                  onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                >
                  <option value="">Selecione o departamento</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </Select>
              </div>
              {/* Permissões */}
              <div className="space-y-4">
                <Label>Permissões</Label>
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onChange={e => {
                        const checked = e.target.checked
                        if (checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, permission.id]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter(id => id !== permission.id)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      {permission.name}
                      <span className="text-gray-500 ml-2">({permission.description})</span>
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Atualizar' : 'Criar'} Usuário
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="department-filter">Departamento</Label>
              <Select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                <option value="">Todos</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </Select>
            </div>
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setSelectedDepartment('')
              setSelectedStatus('')
            }}>
              <Filter className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({totalUsers})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{user.name}</h3>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.departmentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(user.id)}
                      disabled={!user.isActive}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          )}
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 