import { useEffect } from 'react'
import { collectionGroup, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { toast } from 'sonner'
import { isQA } from '@/auth/roles'
import { db } from '@/firebase'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setLotes, setModulos, setOcorrencias, setProgresso, setUsuarios } from '@/store/slices/data'
import type { Progresso } from '@/types'
import { fromLote, lotesCol } from './lotes'
import { fromModulo, modulosCol } from './modulos'
import { fromOcorrencia, ocorrenciasCol } from './ocorrencias'
import { fromUsuario, usuariosCol } from './usuarios'

const falha = (o: string) => (e: Error) => {
  console.error(`[firestore] ${o}`, e)
  toast.error(`Não foi possível carregar ${o}.`)
}

/** Mantém o slice `data` sincronizado com o Firestore conforme o nível do usuário. */
export function DataSync() {
  const role = useAppSelector((s) => s.auth.role)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!role || role === 'pendente') return
    const subs: Unsubscribe[] = []

    // Lotes e progresso: QA, admin e dev.
    subs.push(
      onSnapshot(
        query(lotesCol, orderBy('criadoEm', 'desc')),
        (s) => dispatch(setLotes(s.docs.map(fromLote))),
        falha('os lotes'),
      ),
      onSnapshot(
        collectionGroup(db, 'progresso'),
        (s) => {
          const p: Progresso = {}
          s.docs.forEach((d) => {
            const loteId = d.ref.parent.parent?.id
            if (loteId && d.get('feito')) (p[loteId] ??= {})[d.id] = true
          })
          dispatch(setProgresso(p))
        },
        falha('o progresso'),
      ),
    )

    // Cadastros do QA: módulos e ocorrências ficam privados para o dev.
    if (isQA(role)) {
      subs.push(
        onSnapshot(modulosCol, (s) => dispatch(setModulos(s.docs.map(fromModulo))), falha('os módulos')),
        onSnapshot(
          query(ocorrenciasCol, orderBy('criadoEm', 'asc')),
          (s) => dispatch(setOcorrencias(s.docs.map(fromOcorrencia))),
          falha('as ocorrências'),
        ),
      )
    }

    if (role === 'admin') {
      subs.push(onSnapshot(usuariosCol, (s) => dispatch(setUsuarios(s.docs.map(fromUsuario))), falha('os usuários')))
    }

    return () => subs.forEach((u) => u())
  }, [role, dispatch])

  return null
}
