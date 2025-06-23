'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('User authenticated, redirecting to dashboard')
        router.replace('/dashboard')
      } else {
        console.log('No user, redirecting to login')
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="h-16 w-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-2xl">GT</span>
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Grupo Thermas
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Verificando autenticação...' : 'Redirecionando...'}
        </p>
      </motion.div>
    </div>
  )
} 