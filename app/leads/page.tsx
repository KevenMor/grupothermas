'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lead } from '@/lib/models'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Kanban from '@/components/Kanban'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: any
    let authInstance: any
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      import('@/lib/firebase').then(({ auth }) => {
        authInstance = auth
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            router.push('/login' as any)
            return
          }
          setCurrentUser(user)
          await loadLeads(user.uid)
        })
      })
    })
    return () => unsubscribe && unsubscribe()
  }, [router])

  const loadLeads = async (uid: string) => {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    try {
      const leadsRef = collection(db, 'leads')
      const q = query(leadsRef, where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      const leadsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Lead[]
      setLeads(leadsData)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLead = async (leadId: string, stage: Lead['stage']) => {
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    try {
      const leadRef = doc(db, 'leads', leadId)
      await updateDoc(leadRef, {
        stage,
        updatedAt: new Date(),
      })
      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId
            ? { ...lead, stage, updatedAt: new Date() }
            : lead
        )
      )
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Erro ao atualizar lead')
    }
  }

  const handleAddLead = async () => {
    if (!currentUser) return
    const name = prompt('Nome do lead:')
    if (!name) return
    const phone = prompt('Telefone:')
    if (!phone) return
    const email = prompt('E-mail (opcional):') || ''
    const { addDoc, collection } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    try {
      const newLead = {
        uid: currentUser.uid,
        name,
        phone,
        email,
        stage: 'new' as Lead['stage'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const docRef = await addDoc(collection(db, 'leads'), newLead)
      setLeads(prev => [...prev, { ...newLead, id: docRef.id }])
    } catch (error) {
      console.error('Error adding lead:', error)
      alert('Erro ao adicionar lead')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard' as any)}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Kanban de Leads</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Kanban
          leads={leads}
          onUpdateLead={handleUpdateLead}
          onAddLead={handleAddLead}
        />
      </div>
    </div>
  )
} 