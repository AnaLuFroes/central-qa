import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import type { Perfil } from '@/types'

/** Para onde mandar a pessoa logada que não pode ver a página pedida. */
export function useHome(): string {
  const { user, situacao, superAdmin } = useAuth()
  if (!user) return '/entrar'
  if (situacao === 'ok') return '/sistemas'
  if (superAdmin) return '/plataforma/empresas'
  return '/aguardando'
}

/** Página de membro de empresa ativa, com um dos perfis indicados. */
export function RequireRole({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { user, situacao, membro } = useAuth()
  const home = useHome()
  const loc = useLocation()
  if (!user) return <Navigate to="/entrar" replace state={{ from: loc.pathname }} />
  if (situacao !== 'ok' || !membro || !perfis.includes(membro.perfil)) return <Navigate to={home} replace />
  return <>{children}</>
}

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, superAdmin, situacao } = useAuth()
  const home = useHome()
  if (!user) return <Navigate to="/entrar" replace />
  if (!superAdmin || situacao === 'verificar') return <Navigate to={home} replace />
  return <>{children}</>
}
