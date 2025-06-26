'use client'
export const dynamic = 'force-dynamic'
if (typeof window === 'undefined') {
  throw new Error('Esta página só pode ser renderizada no client');
}
// ... existing code from page.tsx ... 