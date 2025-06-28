// API Helpers for external integrations
export interface CEPResponse {
  cep: string
  state: string
  city: string
  district: string
  street: string
}

export interface WhatsAppVerifyResponse {
  valid: boolean
  message?: string
}

// Fetch CEP data from BrasilAPI
export async function fetchCEP(cep: string): Promise<CEPResponse | null> {
  try {
    const cleanCep = cep.replace(/\D/g, '')
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`)
    
    if (!response.ok) {
      throw new Error('CEP not found')
    }
    
    const data = await response.json()
    return {
      cep: data.cep,
      state: data.state,
      city: data.city,
      district: data.district,
      street: data.street,
    }
  } catch (error) {
    console.error('Error fetching CEP:', error)
    return null
  }
}

// Verify WhatsApp number (mock implementation)
export async function verifyWhatsApp(phone: string): Promise<WhatsAppVerifyResponse> {
  // TODO: Replace with actual WhatsApp verification API
  return new Promise((resolve) => {
    setTimeout(() => {
      const cleanPhone = phone.replace(/\D/g, '')
      resolve({
        valid: cleanPhone.length === 11,
        message: cleanPhone.length === 11 ? 'Número válido' : 'Número inválido'
      })
    }, 1000)
  })
}

// Send data to Make webhook
export async function sendToMakeWebhook(contractData: any): Promise<boolean> {
  try {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/ppj3n7wy1f76yg7091t6g7t72nq8c9w4'
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    })
    
    return response.ok
  } catch (error) {
    console.error('Error sending to Make webhook:', error)
    return false
  }
}

// Utility functions
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function capitalizeName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false
  }
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) return false
  
  return true
}

import { auth } from './firebase'

export async function authFetch(input: RequestInfo, init: RequestInit = {}, user?: any) {
  if (!user) throw new Error('Usuário não autenticado')
  const token = await user.getIdToken()
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
} 