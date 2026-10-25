import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { toast } from 'sonner'
import { isQA } from '@/auth/roles'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  limparDados,
  setFeatures,
  setIA,
  setLotes,
  setMembros,
  setModulos,
  setOcorrencias,
  setRespostas,
  setRodadas,
  setSistemas,
} from '@/store/slices/data'
import { featuresCol, fromFeature } from './features'
import { fromConfigIA, iaRef } from './iaConfig'
import { fromLote, lotesCol } from './lotes'
import { fromMembro, membrosCol } from './membros'
import { fromModulo, modulosCol } from './modulos'
import { fromOcorrencia, ocorrenciasCol } from './ocorrencias'
import { agruparRespostas, fromResposta, respostasCol } from './respostas'
import { fromRodada, rodadasCol } from './rodadas'
import { fromSistema, sistemasCol } from './sistemas'

const MAX_TENTATIVAS = 3

/** Mantém o slice `data` sincronizado com o Firestore da empresa, conforme o perfil. */
export function DataSync() {
  const orgId = useAppSelector((s) => s.auth.orgId)
  const perfil = useAppSelector((s) => s.auth.perfil)
  const dispatch = useAppDispatch()
  // Logo depois de aprovar a empresa ou mudar o perfil, o servidor pode ainda negar a leitura:
  // tenta de novo algumas vezes antes de avisar.
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!orgId || !perfil) return
    const subs: Unsubscribe[] = []
    let refazer: ReturnType<typeof setTimeout> | undefined
    const falha = (o: string) => (e: Error & { code?: string }) => {
      if (e.code === 'permission-denied' && tentativa < MAX_TENTATIVAS) {
        clearTimeout(refazer)
        refazer = setTimeout(() => setTentativa((t) => t + 1), 1500 * (tentativa + 1))
        return
      }
      console.error(`[firestore] ${o}`, e)
      toast.error(`Não foi possível carregar ${o}.`)
    }

    // Sistemas, lotes e respostas: todos os perfis.
    subs.push(
      onSnapshot(sistemasCol(orgId), (s) => dispatch(setSistemas(s.docs.map(fromSistema))), falha('os sistemas')),
      onSnapshot(
        query(lotesCol(orgId), orderBy('criadoEm', 'desc')),
        (s) => dispatch(setLotes(s.docs.map(fromLote))),
        falha('os lotes'),
      ),
      onSnapshot(
        respostasCol(orgId),
        (s) => dispatch(setRespostas(agruparRespostas(s.docs.map(fromResposta)))),
        falha('as respostas do dev'),
      ),
    )

    // Cadastros do QA: o dev só vê o que foi enviado nos lotes.
    if (isQA(perfil)) {
      subs.push(
        onSnapshot(modulosCol(orgId), (s) => dispatch(setModulos(s.docs.map(fromModulo))), falha('os módulos')),
        onSnapshot(
          query(ocorrenciasCol(orgId), orderBy('criadoEm', 'asc')),
          (s) => dispatch(setOcorrencias(s.docs.map(fromOcorrencia))),
          falha('as ocorrências'),
        ),
        onSnapshot(
          query(featuresCol(orgId), orderBy('criadoEm', 'asc')),
          (s) => dispatch(setFeatures(s.docs.map(fromFeature))),
          falha('os casos de teste'),
        ),
        onSnapshot(rodadasCol(orgId), (s) => dispatch(setRodadas(s.docs.map(fromRodada))), falha('as rodadas')),
        onSnapshot(iaRef(orgId), (s) => dispatch(setIA(fromConfigIA(s))), () => dispatch(setIA(null))),
      )
    }

    if (perfil === 'Admin') {
      subs.push(onSnapshot(membrosCol(orgId), (s) => dispatch(setMembros(s.docs.map(fromMembro))), falha('a equipe')))
    }

    return () => {
      clearTimeout(refazer)
      subs.forEach((u) => u())
      dispatch(limparDados())
    }
  }, [orgId, perfil, tentativa, dispatch])

  return null
}
