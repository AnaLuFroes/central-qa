import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { homeFor } from '@/auth/roles'
import { Hero, HeroLead, HeroTitle, Main } from '@/components/Hero'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ERROS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'A senha precisa ter ao menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/popup-closed-by-user': 'Login cancelado.',
}

export default function Login() {
  const { user, role, entrarComGoogle, entrarComEmail, criarConta } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  if (user) return <Navigate to={homeFor(role)} replace />

  const run = async (fn: () => Promise<void>) => {
    setErro('')
    setOcupado(true)
    try {
      await fn()
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      setErro(ERROS[code] ?? 'Não foi possível entrar. ' + (e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => (modo === 'entrar' ? entrarComEmail(email, senha) : criarConta(nome, email, senha)))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Hero className="pt-11 pb-24">
        <HeroTitle>Central de QA</HeroTitle>
        <HeroLead className="text-[1.15rem]">
          Cadastre erros e melhorias, organize no padrão de correção e envie ao dev só o que ele precisa ver.
        </HeroLead>
      </Hero>
      <Main>
        <div className="relative mx-auto -mt-14 w-full max-w-[440px] rounded-2xl border bg-card p-7 shadow-card">
          <h2 className="m-0 mb-1 font-serif text-[1.4rem] font-semibold">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h2>
          <p className="m-0 mb-5 text-[.92rem] text-muted-foreground">
            O acesso é liberado por nível (Administrador, QA ou Dev) pelo administrador.
          </p>
          <Button variant="outline" size="lg" className="w-full" disabled={ocupado} onClick={() => run(entrarComGoogle)}>
            <GoogleIcon /> Continuar com Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-[.8rem] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou com e-mail
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3">
            {modo === 'criar' && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-background" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            {erro && <p className="m-0 text-[.86rem] text-destructive">{erro}</p>}
            <Button type="submit" variant="gradient" size="lg" disabled={ocupado}>
              {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
          <button
            className="mt-4 text-[.9rem] text-primary hover:underline"
            onClick={() => {
              setModo(modo === 'entrar' ? 'criar' : 'entrar')
              setErro('')
            }}
          >
            {modo === 'entrar' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </Main>
      <Footer />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 0 0 0 9.6L5.8 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.2L5.8 10c.9-2.6 3.3-4.6 6.2-4.6z" />
    </svg>
  )
}
