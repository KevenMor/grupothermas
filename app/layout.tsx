'use client'
export const dynamic = 'force-dynamic'

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Grupo Thermas - Sistema de Vendas</title>
        <meta name="description" content="Sistema interno de gestão de vendas do Grupo Thermas - Referência em CRM e gestão comercial" />
        <meta name="keywords" content="CRM, vendas, gestão, Grupo Thermas, contratos, leads" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#0098D8" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#005B9F" media="(prefers-color-scheme: dark)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 