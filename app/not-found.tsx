'use client'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function NotFound() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>Página não encontrada</h1>
      <p>O recurso solicitado não existe.</p>
    </div>
  )
} 