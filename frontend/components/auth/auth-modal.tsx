"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setError('')
    setShowVerificationMessage(false)
    setRegistrationSuccess(false)
  }

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode)
    resetForm()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        onOpenChange(false)
        resetForm()
      } else if (result.needsVerification) {
        setShowVerificationMessage(true)
      } else {
        setError('Email hoac mat khau khong dung')
      }
    } catch {
      setError('Co loi xay ra. Vui long thu lai.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await register(email, password, fullName)
      if (result.success) {
        setRegistrationSuccess(true)
      } else {
        setError('Dang ky that bai. Vui long thu lai.')
      }
    } catch {
      setError('Co loi xay ra. Vui long thu lai.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        {registrationSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl">Kiem tra email cua ban</DialogTitle>
              <DialogDescription className="mt-2">
                Vui long xac minh dia chi email cua ban. Kiem tra thu muc spam neu ban 
                khong thay email. Lien ket xac minh co hieu luc trong 24 gio.
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-6 rounded-full" 
              onClick={() => handleModeSwitch('login')}
            >
              Quay lai dang nhap
            </Button>
          </div>
        ) : showVerificationMessage ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl">Xac minh email cua ban</DialogTitle>
              <DialogDescription className="mt-2">
                Email cua ban chua duoc xac minh. Vui long kiem tra hop thu den (va thu muc spam) 
                de tim lien ket xac minh. Lien ket co hieu luc trong 24 gio.
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-6 rounded-full" 
              onClick={() => setShowVerificationMessage(false)}
            >
              Thu lai
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {mode === 'login' ? 'Chao mung tro lai' : 'Tao tai khoan'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'login' 
                  ? 'Dang nhap de tiep tuc voi Second Life' 
                  : 'Tham gia Second Life de bat dau mua va thue'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ho va ten</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Nhap ho va ten cua ban"
                      className="pl-10 rounded-xl"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhap email cua ban"
                    className="pl-10 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mat khau</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhap mat khau cua ban"
                    className="pl-10 pr-10 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl h-11" disabled={isLoading}>
                {isLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : mode === 'login' ? (
                  'Dang nhap'
                ) : (
                  'Tao tai khoan'
                )}
              </Button>
            </form>

            <div className="text-center text-sm mt-4">
              {mode === 'login' ? (
                <p className="text-muted-foreground">
                  Chua co tai khoan?{' '}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => handleModeSwitch('register')}
                  >
                    Dang ky
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Da co tai khoan?{' '}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => handleModeSwitch('login')}
                  >
                    Dang nhap
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
