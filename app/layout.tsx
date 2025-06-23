import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grupo Thermas - Sistema de Vendas',
  description: 'Sistema interno de gestão de vendas do Grupo Thermas - Referência em CRM e gestão comercial',
  keywords: 'CRM, vendas, gestão, Grupo Thermas, contratos, leads',
  authors: [{ name: 'Grupo Thermas' }],
  creator: 'Grupo Thermas',
  publisher: 'Grupo Thermas',
  robots: 'noindex, nofollow', // Sistema interno
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0098D8' },
    { media: '(prefers-color-scheme: dark)', color: '#005B9F' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
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