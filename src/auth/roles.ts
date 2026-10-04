import type { Role } from '@/types'

export const ROLES: Role[] = ['admin', 'qa', 'dev', 'pendente']

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  qa: 'QA',
  dev: 'Dev',
  pendente: 'Pendente',
}

export const isQA = (r: Role | null | undefined) => r === 'admin' || r === 'qa'
export const homeFor = (r: Role | null | undefined) => (r === 'dev' ? '/dev' : r === 'pendente' || !r ? '/pendente' : '/')
