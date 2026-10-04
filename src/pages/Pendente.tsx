import { Clock } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { homeFor } from '@/auth/roles'
import { Footer } from '@/components/Footer'
import { Hero, HeroLead, HeroTitle, Main } from '@/components/Hero'

export default function Pendente() {
  const { user, role } = useAuth()
  if (role && role !== 'pendente') return <Navigate to={homeFor(role)} replace />
  return (
    <div className="flex min-h-screen flex-col">
      <Hero className="pt-11 pb-24">
        <HeroTitle>Central de QA</HeroTitle>
        <HeroLead>Olá{user?.displayName ? `, ${user.displayName}` : ''}! Sua conta foi criada.</HeroLead>
      </Hero>
      <Main>
        <div className="relative mx-auto -mt-14 flex max-w-[520px] items-start gap-4 rounded-2xl border bg-card p-7 shadow-card">
          <span className="grid size-11 flex-none place-items-center rounded-xl bg-pendente-bg text-pendente">
            <Clock className="size-5" />
          </span>
          <div>
            <h2 className="m-0 mb-1 font-serif text-[1.3rem] font-semibold">Aguardando liberação do administrador</h2>
            <p className="m-0 text-muted-foreground">
              Um administrador precisa definir seu nível de acesso (QA ou Dev). Assim que isso acontecer, esta página
              atualiza sozinha.
            </p>
            <p className="mt-3 mb-0 text-[.9rem] text-muted-foreground">
              Conta: <b className="text-foreground">{user?.email}</b>
            </p>
          </div>
        </div>
      </Main>
      <Footer />
    </div>
  )
}
