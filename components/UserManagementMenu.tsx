'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Building2,
  X,
  Mail,
  Phone,
  Shield,
  Edit,
  Trash2
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'agent'
  status: 'active' | 'inactive'
  permissions: string[]
}

interface UserManagementMenuProps {
  isOpen: boolean
  onClose: () => void
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@grupothermas.com.br',
    phone: '+55 11 99999-0001',
    role: 'agent',
    status: 'active',
    permissions: ['chat', 'view_reports']
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@grupothermas.com.br',
    phone: '+55 11 99999-0002',
    role: 'manager',
    status: 'active',
    permissions: ['chat', 'view_reports', 'manage_team', 'admin_panel']
  }
]

const availablePermissions = [
  { id: 'chat', label: 'Chat/Atendimento' },
  { id: 'view_reports', label: 'Ver Relatórios' },
  { id: 'manage_team', label: 'Gerenciar Equipe' },
  { id: 'admin_panel', label: 'Painel Admin' },
  { id: 'user_management', label: 'Gestão de Usuários' },
  { id: 'system_config', label: 'Configurações do Sistema' }
]

export function UserManagementMenu({ isOpen, onClose }: UserManagementMenuProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'add-user'>('users')
  const [users, setUsers] = useState<User[]>(mockUsers)
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent' as const,
    permissions: [] as string[]
  })

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      status: 'active'
    }

    setUsers([...users, user])
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      permissions: []
    })
    setActiveTab('users')
    alert('Usuário criado com sucesso!')
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const togglePermission = (permission: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      case 'agent': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'manager': return 'Gerente'
      case 'agent': return 'Agente'
      default: return role
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Gestão de Usuários
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie usuários e permissões do sistema
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('add-user')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'add-user'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Novo Usuário
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Tab: Usuários */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.map(user => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleText(user.role)}
                            </Badge>
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tab: Novo Usuário */}
          {activeTab === 'add-user' && (
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@grupothermas.com.br"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <Input
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+55 11 99999-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cargo</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value="agent">Agente</option>
                    <option value="manager">Gerente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Permissões do Sistema</label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map(permission => (
                    <label key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newUser.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setNewUser({
                    name: '', email: '', phone: '', role: 'agent', permissions: []
                  })}
                >
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 