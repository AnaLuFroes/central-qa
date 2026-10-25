import { toast } from 'sonner'
import { encerrarOcorrencia, reabrirOcorrencia, validarOcorrencia } from '@/data/ocorrencias'
import { criarRegressao } from '@/data/regressao'
import { responderComoQA } from '@/data/respostas'
import { itemKey } from '@/lib/status'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setReply } from '@/store/slices/drafts'
import { selFeatures } from '@/store/slices/selectors'
import type { Ocorrencia } from '@/types'
import { useExecutar, useSessao, useSistema } from './useSessao'

/** Ações do QA sobre uma ocorrência (validar, reabrir, encerrar, regressão, responder ao dev). */
export function useOcorrenciaAcoes() {
  const { orgId, nome } = useSessao()
  const exec = useExecutar()
  const dispatch = useAppDispatch()
  const feats = useAppSelector(selFeatures)
  const lotes = useAppSelector((s) => s.data.lotes)
  const sistema = useSistema()
  return {
    validar: (f: Ocorrencia) => exec(validarOcorrencia(orgId, f), 'Ocorrência validada'),
    reabrir: (f: Ocorrencia) => exec(reabrirOcorrencia(orgId, f), 'Reaberta. Ela entra no próximo lote.'),
    encerrar: (f: Ocorrencia) => exec(encerrarOcorrencia(orgId, f), 'Ocorrência encerrada sem correção'),
    regressao: async (f: Ocorrencia) => {
      const t = await exec(criarRegressao(orgId, f, feats, sistema?.nome ?? ''))
      if (t) toast(t)
    },
    /** Responde ao dev na conversa do item do lote atual. */
    responder: async (f: Ocorrencia, texto: string) => {
      const txt = texto.trim()
      if (!txt) return void toast('Escreva a resposta antes de enviar')
      const key = f.loteId ? itemKey(lotes.find((l) => l.id === f.loteId), f.id) : null
      if (!f.loteId || !key) return
      const ok = await exec(responderComoQA(orgId, f.loteId, key, txt, nome).then(() => true), 'Resposta enviada ao dev')
      if (ok) dispatch(setReply({ id: f.id, txt: '' }))
    },
  }
}
