"use client"

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import { mockUser } from '@/lib/mock-data'

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; needsVerification?: boolean }>
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string): Promise<{ success: boolean; needsVerification?: boolean }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock: if email contains "unverified", return needs verification
    if (email.includes('unverified')) {
      return { success: false, needsVerification: true }
    }
    
    // Mock successful login
    setUser({ ...mockUser, email })
    return { success: true }
  }

  const register = async (email: string, password: string, fullName: string): Promise<{ success: boolean }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout }}>
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
