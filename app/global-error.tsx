'use client'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h1>Erro Global</h1>
          <p>Algo deu errado. Tente novamente.</p>
          <button onClick={reset}>Tentar novamente</button>
        </div>
      </body>
    </html>
  )
} 