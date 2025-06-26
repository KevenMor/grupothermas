'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  if (typeof window !== "undefined") {
    console.log("API KEY em produção:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  }

  useEffect(() => {
    let unsubscribe: any
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      import('@/lib/firebase').then(({ auth }) => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user ? 'User logged in' : 'User logged out')
          setUser(user)
          setLoading(false)
        }, (error) => {
          console.error('Auth state change error:', error)
          setLoading(false)
        })
      })
    })
    return () => unsubscribe && unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const { auth } = await import('@/lib/firebase')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    const { createUserWithEmailAndPassword } = await import('firebase/auth')
    const { auth } = await import('@/lib/firebase')
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signOut = async () => {
    const firebaseAuth = await import('firebase/auth')
    const { auth } = await import('@/lib/firebase')
    try {
      await firebaseAuth.signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 