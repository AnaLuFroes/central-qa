import { useCallback } from 'react'
import { toast } from 'sonner'
import { isQA } from '@/auth/roles'
import { useAppSelector } from '@/store/hooks'
import { selSistema } from '@/store/slices/selectors'

/** Quem está logado e em qual empresa (para as funções de gravação). */
export function useSessao() {
  const a = useAppSelector((s) => s.auth)
  return {
    orgId: a.orgId ?? '',
    uid: a.uid ?? '',
    nome: a.nome,
    email: a.email,
    foto: a.foto,
    perfil: a.perfil,
    isAdmin: a.perfil === 'Admin',
    isQA: isQA(a.perfil),
    isDev: a.perfil === 'Dev',
  }
}

/** Sistema aberto (ou null). */
export const useSistema = () => useAppSelector(selSistema)

/** Roda uma gravação mostrando o aviso de sucesso ou o erro. */
export function useExecutar() {
  return useCallback(async <T,>(p: Promise<T>, ok?: string): Promise<T | undefined> => {
    try {
      const r = await p
      if (ok) toast(ok)
      return r
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível salvar. ' + ((e as Error)?.message ?? ''))
      return undefined
    }
  }, [])
}

/** Clique duplo para confirmar ações destrutivas ("Clique de novo para confirmar"). */
export { useArmar } from './useArmar'
