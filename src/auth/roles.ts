import type { Perfil } from '@/types'

export const PERFIS: Perfil[] = ['QA', 'Dev', 'Admin']

export const PERFIL_LABEL: Record<Perfil, string> = { QA: 'QA', Dev: 'Desenvolvedor', Admin: 'Administrador' }

export const PERFIL_COR: Record<Perfil, string> = { QA: '#8FF0F2', Dev: '#C39BF5', Admin: '#FFC879' }

export const PERFIL_DESC: Record<Perfil, string> = {
  QA: 'Cadastra ocorrências, gera casos de teste, roda testes e envia lotes ao dev.',
  Dev: 'Vê só os lotes enviados para ele e responde item a item.',
  Admin: 'Tudo do QA, mais sistemas da empresa e perfis da equipe.',
}

/** Admin conta como QA nas funções do dia a dia. */
export const isQA = (p: Perfil | null | undefined) => p === 'QA' || p === 'Admin'
