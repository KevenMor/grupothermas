'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { UserManagementMenu } from '@/components/UserManagementMenu'
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarToggle,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSubmenu,
  SidebarNavSubItem,
  SidebarGroup,
  useSidebar,
  SidebarNavNestedSubmenu
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  LayoutDashboard,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  MessageSquare,
  MessageCircle,
  Menu,
  X,
  HeadphonesIcon,
  Kanban,
  UserCheck,
  Bot,
  ShoppingCart,
  FileText,
  Users,
  Zap,
  BookOpen,
  GitBranch,
  TestTube,
  Wifi,
  Key,
  Shield,
  Package,
  Database,
  Clock,
  ArrowRight,
  UserPlus,
  DollarSign,
  Target,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  Receipt,
  FileCheck,
  FileX,
  FileClock,
  BarChart3,
  Users2,
  UserCog,
  ShieldCheck,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Toaster } from 'sonner'

interface AppLayoutProps {
  children: React.ReactNode
}

function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso')
      router.push('/login' as any)
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  // Função utilitária para buscar total de não lidas
  const fetchUnreadCount = async () => {
    const res = await fetch('/api/atendimento/chats')
    if (!res.ok) return 0
    const data = await res.json()
    if (Array.isArray(data)) {
      return data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
    }
    return 0
  }

  // Notificações de não lidas para menu Atendimento
  const { data: unreadCount } = useSWR('unread-chats', fetchUnreadCount, { refreshInterval: 2000 })
  const [lastUnreadCount, setLastUnreadCount] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (unreadCount > lastUnreadCount) {
      // Notificação sonora
      const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3')
      audio.play().catch(() => {})
      // Toast visual
      toast(`Nova mensagem recebida! Você tem ${unreadCount} mensagem(ns) não lida(s) no Atendimento.`, {
        position: 'top-right',
        duration: 4000,
      })
    }
    setLastUnreadCount(unreadCount)
  }, [unreadCount])

  return (
    <>
      <Toaster richColors position="top-right" />
      <Sidebar>
        <SidebarToggle />
        
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2">
            {/* Logo real do Grupo Thermas */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border">
              <img
                src="https://static.wixstatic.com/media/1fe811_885a4937ced44f5cae82c5ebef44348c~mv2.png/v1/crop/x_45,y_0,w_1151,h_958/fill/w_213,h_177,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo-grupothermas_Prancheta%201.png"
                alt="Grupo Thermas"
                className="h-8 w-8 object-contain"
              />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Grupo Thermas
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Vendas
              </span>
            </motion.div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup title="Principal">
            <SidebarNav>
              {/* Dashboard */}
              <SidebarNavItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                active={pathname === '/dashboard'}
                onClick={() => router.push('/dashboard' as any)}
              >
                Dashboard
              </SidebarNavItem>

              {/* Configuração IA - Menu Agrupado */}
              <SidebarNavSubmenu
                title="Configuração IA"
                icon={<Bot className="h-4 w-4 text-blue-600" />}
                defaultOpen={pathname.startsWith('/admin') && (
                  pathname === '/admin' ||
                  pathname.startsWith('/admin/ia-training') ||
                  pathname.startsWith('/admin/flow-editor')
                )}
                className="font-bold text-base"
              >
                <SidebarNavSubItem
                  icon={<Zap className="h-4 w-4 text-yellow-500" />}
                  active={pathname === '/admin'}
                  onClick={() => router.push('/admin' as any)}
                >
                  OpenAI
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<Wifi className="h-4 w-4 text-green-600" />}
                  active={pathname === '/admin'}
                  onClick={() => router.push('/admin' as any)}
                >
                  Z-API
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<BookOpen className="h-4 w-4 text-purple-600" />}
                  active={pathname.startsWith('/admin/ia-training')}
                  onClick={() => router.push('/admin/ia-training' as any)}
                >
                  Treinamento IA
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<GitBranch className="h-4 w-4 text-pink-600" />}
                  active={pathname === '/admin/flow-editor'}
                  onClick={() => router.push('/admin/flow-editor' as any)}
                >
                  Fluxograma
                </SidebarNavSubItem>
              </SidebarNavSubmenu>

              {/* Atendimento com submenus hierárquicos */}
              <SidebarNavSubmenu
                title="Atendimento"
                icon={
                  <span className="relative">
                    <HeadphonesIcon className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-gray-900">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                }
                defaultOpen={pathname.startsWith('/atendimento') || pathname === '/kanban'}
              >
                <SidebarNavSubItem
                  icon={<MessageSquare className="h-4 w-4" />}
                  active={pathname === '/atendimento'}
                  onClick={() => router.push('/atendimento' as any)}
                >
                  Chat
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<Kanban className="h-4 w-4" />}
                  active={pathname === '/kanban'}
                  onClick={() => router.push('/kanban' as any)}
                >
                  Kanban
                </SidebarNavSubItem>
              </SidebarNavSubmenu>

              {/* CRM e Vendas com submenus */}
              <SidebarNavSubmenu
                title="CRM & Vendas"
                icon={<TrendingUp className="h-4 w-4" />}
                defaultOpen={pathname.startsWith('/sales') || pathname === '/contracts' || pathname === '/leads'}
              >
                <SidebarNavSubItem
                  icon={<DollarSign className="h-4 w-4" />}
                  active={pathname === '/sales'}
                  onClick={() => router.push('/sales' as any)}
                >
                  Gestão de Vendas
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<UserCheck className="h-4 w-4" />}
                  active={pathname === '/leads'}
                  onClick={() => router.push('/leads' as any)}
                >
                  Gestão de Leads
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<FileText className="h-4 w-4" />}
                  active={pathname === '/contracts'}
                  onClick={() => router.push('/contracts' as any)}
                >
                  Contratos
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<BarChart3 className="h-4 w-4" />}
                  active={pathname === '/dashboard'}
                  onClick={() => router.push('/dashboard' as any)}
                >
                  Relatórios
                </SidebarNavSubItem>
              </SidebarNavSubmenu>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup title="Administração">
            <SidebarNav>
              {/* Gestão de Usuários */}
              <SidebarNavSubmenu
                title="Gestão de Usuários"
                icon={<Users2 className="h-4 w-4" />}
                defaultOpen={pathname.startsWith('/admin/users')}
              >
                <SidebarNavSubItem
                  icon={<UserPlus className="h-4 w-4" />}
                  active={pathname.startsWith('/admin/users')}
                  onClick={() => router.push('/admin/users' as any)}
                >
                  Gerenciar Usuários
                </SidebarNavSubItem>
              </SidebarNavSubmenu>
              {/* Departamentos como submenu expansível */}
              <SidebarNavSubmenu
                title="Departamentos"
                icon={<Building className="h-4 w-4" />}
                defaultOpen={pathname.startsWith('/admin/departments')}
              >
                <SidebarNavSubItem
                  icon={<Building className="h-4 w-4" />}
                  active={pathname.startsWith('/admin/departments')}
                  onClick={() => router.push('/admin/departments' as any)}
                >
                  Gerenciar Departamentos
                </SidebarNavSubItem>
              </SidebarNavSubmenu>

              {/* Configurações do Sistema */}
              <SidebarNavSubmenu
                title="Configurações"
                icon={<Settings className="h-4 w-4" />}
                defaultOpen={pathname === '/admin'}
              >
                <SidebarNavSubItem
                  icon={<ShieldCheck className="h-4 w-4" />}
                  active={pathname === '/admin'}
                  onClick={() => router.push('/admin' as any)}
                >
                  Segurança
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<Activity className="h-4 w-4" />}
                  active={pathname === '/admin'}
                  onClick={() => router.push('/admin' as any)}
                >
                  Auditoria
                </SidebarNavSubItem>
                <SidebarNavSubItem
                  icon={<Database className="h-4 w-4" />}
                  active={pathname === '/admin'}
                  onClick={() => router.push('/admin' as any)}
                >
                  Backup
                </SidebarNavSubItem>
              </SidebarNavSubmenu>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup title="Ações Rápidas">
            <SidebarNav>
              <SidebarNavItem
                icon={<UserPlus className="h-4 w-4" />}
                onClick={() => router.push('/leads' as any)}
              >
                Novo Lead
              </SidebarNavItem>
              <SidebarNavItem
                icon={<DollarSign className="h-4 w-4" />}
                onClick={() => router.push('/sales' as any)}
              >
                Nova Venda
              </SidebarNavItem>
              <SidebarNavItem
                icon={<Users className="h-4 w-4" />}
                onClick={() => router.push('/admin/users' as any)}
              >
                Novo Usuário
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-8 w-8 border cursor-pointer" onClick={() => router.push('/users/profile')}>
              <AvatarFallback className="text-xs bg-gradient-to-r from-thermas-blue-500 to-thermas-orange-500 text-white font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => router.push('/users/profile')}
            >
              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'usuario@email.com'}
              </p>
            </motion.div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}

function AppHeader() {
  const { isOpen } = useSidebar()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm"
    >
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex flex-1 items-center gap-4">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Users Management */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowUserMenu(true)}
            title="Gestão de Usuários"
          >
            <Users className="h-4 w-4" />
            <span className="sr-only">Usuários</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-destructive text-xs"></span>
            <span className="sr-only">Notificações</span>
          </Button>

          <ThemeToggle />
        </div>
      </div>
      
      {/* User Management Menu */}
      <UserManagementMenu 
        isOpen={showUserMenu} 
        onClose={() => setShowUserMenu(false)} 
      />
    </motion.header>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  console.debug('[AppLayout] MONTADO')
  const router = useRouter()
  const { user, loading } = useAuth()

  React.useEffect(() => {
    if (loading) {
      return
    }
    
    if (!user) {
      router.push('/login' as any)
      return
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">GT</span>
          </div>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-sm text-muted-foreground">Carregando sistema...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect will happen in useEffect
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
} 