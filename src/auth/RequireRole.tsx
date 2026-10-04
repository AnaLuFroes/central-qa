import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { homeFor } from '@/auth/roles'
import type { Role } from '@/types'

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, role } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (!role || !roles.includes(role)) return <Navigate to={homeFor(role)} replace />
  return <>{children}</>
}
