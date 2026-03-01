import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Loader2, AlertTriangle } from 'lucide-react'

export default function Login() {
  const { user, loading, configured, signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.')
      return
    }

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.')
        return
      }
    }

    setSubmitting(true)

    if (isRegister) {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error)
      } else {
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
      }
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="gradient-brand p-3 rounded-xl">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">
            {isRegister ? 'Criar Conta' : 'Entrar'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? 'Preencha os dados para criar sua conta' : 'Acesse sua conta para continuar'}
          </p>
        </CardHeader>
        <CardContent>
          {!configured && (
            <div className="flex items-start gap-3 bg-warning/10 text-warning-foreground px-4 py-3 rounded-lg mb-4">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Supabase nao configurado</p>
                <p className="text-muted-foreground mt-1">
                  Edite o arquivo <code className="bg-secondary px-1 rounded">.env.local</code> com sua URL e Anon Key do Supabase, depois reinicie o servidor.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>
            {isRegister && (
              <div>
                <label className="text-sm font-medium">Confirmar Senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}
            {success && (
              <p className="text-sm text-success bg-success/10 px-3 py-2 rounded-lg">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRegister ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
                setSuccess('')
              }}
              className="text-sm text-primary hover:underline"
            >
              {isRegister ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar uma'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
