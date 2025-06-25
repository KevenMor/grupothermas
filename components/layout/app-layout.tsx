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
  useSidebar
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
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'

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
      router.push('/login')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  return (
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
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </SidebarNavItem>

            {/* Atendimento com submenus */}
            <SidebarNavSubmenu
              title="Atendimento"
              icon={<HeadphonesIcon className="h-4 w-4" />}
              defaultOpen={pathname.startsWith('/atendimento') || pathname === '/kanban' || pathname === '/admin'}
            >
              <SidebarNavSubItem
                icon={<MessageSquare className="h-4 w-4" />}
                active={pathname === '/atendimento'}
                onClick={() => router.push('/atendimento')}
              >
                Chat
              </SidebarNavSubItem>
              <SidebarNavSubItem
                icon={<Kanban className="h-4 w-4" />}
                active={pathname === '/kanban'}
                onClick={() => router.push('/kanban')}
              >
                Kanban
              </SidebarNavSubItem>
              <SidebarNavSubItem
                icon={<Bot className="h-4 w-4" />}
                active={pathname === '/admin'}
                onClick={() => router.push('/admin')}
              >
                Admin IA
              </SidebarNavSubItem>
            </SidebarNavSubmenu>

            {/* Vendas com submenus */}
            <SidebarNavSubmenu
              title="Vendas"
              icon={<TrendingUp className="h-4 w-4" />}
              defaultOpen={pathname.startsWith('/sales') || pathname === '/contracts'}
            >
              <SidebarNavSubItem
                icon={<ShoppingCart className="h-4 w-4" />}
                active={pathname === '/sales/new'}
                onClick={() => router.push('/sales/new')}
              >
                Nova Venda
              </SidebarNavSubItem>
              <SidebarNavSubItem
                icon={<FileText className="h-4 w-4" />}
                active={pathname === '/contracts'}
                onClick={() => router.push('/contracts')}
              >
                Contratos
              </SidebarNavSubItem>
            </SidebarNavSubmenu>
          </SidebarNav>
        </SidebarGroup>

        <SidebarGroup title="Gestão">
          <SidebarNav>
            <SidebarNavItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => router.push('/settings')}
            >
              Configurações
            </SidebarNavItem>
          </SidebarNav>
        </SidebarGroup>

        <SidebarGroup title="Ações Rápidas">
          <SidebarNav>
            <SidebarNavItem
              icon={<Plus className="h-4 w-4" />}
              onClick={() => router.push('/sales/new')}
            >
              Nova Venda
            </SidebarNavItem>
          </SidebarNav>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="text-xs bg-gradient-to-r from-thermas-blue-500 to-thermas-orange-500 text-white font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 min-w-0"
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
  const router = useRouter()
  const { user, loading } = useAuth()

  React.useEffect(() => {
    if (loading) {
      return
    }
    
    if (!user) {
      router.push('/login')
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