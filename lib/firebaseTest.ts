import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

// Função para testar a conexão
export async function testFirebaseConnection() {
  try {
    console.log('Testando conexão Firebase...')
    
    // Tentar buscar documentos de uma coleção
    const testCollection = collection(db, 'test')
    const snapshot = await getDocs(testCollection)
    
    console.log('Conexão Firebase OK! Documentos encontrados:', snapshot.size)
    return true
  } catch (error) {
    console.error('Erro na conexão Firebase:', error)
    return false
  }
}

// Função para criar dados de teste
export async function createTestData(uid: string) {
  try {
    // Criar alguns leads de teste
    const leadsData = [
      {
        name: 'Maria Silva',
        email: 'maria.silva@email.com',
        phone: '(11) 99999-1111',
        interest: 'Pacote Família',
        status: 'new',
        source: 'Website',
        uid,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'João Santos',
        email: 'joao.santos@email.com',
        phone: '(11) 99999-2222',
        interest: 'Pacote Premium',
        status: 'contacted',
        source: 'Indicação',
        uid,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 99999-3333',
        interest: 'Pacote Básico',
        status: 'qualified',
        source: 'Facebook',
        uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Criar alguns contratos de teste
    const contractsData = [
      {
        customerName: 'Carlos Oliveira',
        customerEmail: 'carlos.oliveira@email.com',
        customerPhone: '(11) 99999-4444',
        packageType: 'Premium',
        value: 3500,
        status: 'signed',
        uid,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        customerName: 'Fernanda Lima',
        customerEmail: 'fernanda.lima@email.com',
        customerPhone: '(11) 99999-5555',
        packageType: 'Família',
        value: 2800,
        status: 'pending',
        uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Inserir leads
    const leadsCollection = collection(db, 'leads')
    for (const lead of leadsData) {
      await addDoc(leadsCollection, lead)
    }

    // Inserir contratos
    const contractsCollection = collection(db, 'contracts')
    for (const contract of contractsData) {
      await addDoc(contractsCollection, contract)
    }

    console.log('Dados de teste criados com sucesso!')
    return true
  } catch (error) {
    console.error('Erro ao criar dados de teste:', error)
    return false
  }
}

// Função para buscar leads do usuário
export async function getUserLeads(uid: string) {
  try {
    const leadsCollection = collection(db, 'leads')
    const q = query(
      leadsCollection,
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    
    const snapshot = await getDocs(q)
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return leads
  } catch (error) {
    console.error('Erro ao buscar leads:', error)
    return []
  }
}

// Função para buscar contratos do usuário
export async function getUserContracts(uid: string) {
  try {
    const contractsCollection = collection(db, 'contracts')
    const q = query(
      contractsCollection,
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    
    const snapshot = await getDocs(q)
    const contracts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return contracts
  } catch (error) {
    console.error('Erro ao buscar contratos:', error)
    return []
  }
} 