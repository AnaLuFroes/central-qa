import { useState } from 'react'
import { Campo, Modal, StatusModal } from '@/components/Modal'
import { inputCls } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { criarLote } from '@/data/lotes'
import { useIr } from '@/hooks/useIr'
import { useExecutar, useSessao, useSistema } from '@/hooks/useSessao'
import { INTRO, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setDraftLote, type FormLote } from '@/store/slices/drafts'
import { selSelecionadas } from '@/store/slices/selectors'
import { limparSelecao, setFRep } from '@/store/slices/ui'

export default function GerarLoteDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const exec = useExecutar()
  const { orgId, uid } = useSessao()
  const sistema = useSistema()
  const escolhidas = useAppSelector(selSelecionadas)
  const draft = useAppSelector((s) => s.drafts.lote)
  const ms = [...new Set(escolhidas.map((x) => x.modulo.trim()).filter(Boolean))]
  const [f, setF] = useState<FormLote>(
    () =>
      draft ?? {
        titulo: ms.length === 1 ? 'Fixes de ' + ms[0] : 'Fixes da validação',
        eyebrow: (sistema?.nome ?? '') + (ms.length === 1 ? ' · ' + ms[0] : ''),
        intro: INTRO,
      },
  )
  const [status, setStatus] = useState('')
  const [gerando, setGerando] = useState(false)

  const re = escolhidas.filter((x) => x.loteId).length
  const cods = escolhidas.map((x) => x.cod).filter(Boolean)
  const lead =
    plural(escolhidas.length, 'ocorrência', 'ocorrências') +
    ' em ' +
    plural(ms.length || 1, 'seção', 'seções') +
    '. Cada item mantém o código fixo dele (' +
    cods.slice(0, 3).join(', ') +
    (escolhidas.length > 3 ? '…' : '') +
    ').' +
    (re ? ' ' + re + ' já ' + (re === 1 ? 'foi enviada' : 'foram enviadas') + ' em outro lote.' : '')

  const set = (p: Partial<FormLote>) => {
    const v = { ...f, ...p }
    setF(v)
    setStatus('')
    dispatch(setDraftLote(v))
  }

  const gerar = async () => {
    const titulo = f.titulo.trim()
    if (!titulo) return setStatus('Dê um título ao lote.')
    if (!escolhidas.length) return setStatus('Selecione ao menos uma ocorrência.')
    setGerando(true)
    const id = await exec(
      criarLote(orgId, sistema?.id ?? '', { titulo, eyebrow: f.eyebrow.trim(), intro: f.intro.trim() }, escolhidas, uid),
      'Lote gerado',
    )
    setGerando(false)
    if (!id) return
    dispatch(limparSelecao())
    dispatch(setDraftLote(null))
    dispatch(setFRep('all'))
    ir.lote(id)
  }

  return (
    <Modal
      onClose={onClose}
      titulo="Gerar lote para o dev"
      descricao={lead}
      rodape={
        <>
          <StatusModal erro>{status}</StatusModal>
          <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primario" size="modal" disabled={gerando} onClick={() => void gerar()}>
            Gerar lote
          </Button>
        </>
      }
    >
      <Campo label="Título da página">
        <input value={f.titulo} onChange={(e) => set({ titulo: e.target.value })} className={inputCls} />
      </Campo>
      <Campo label="Linha de contexto (opcional)">
        <input
          value={f.eyebrow}
          onChange={(e) => set({ eyebrow: e.target.value })}
          placeholder="Ex.: SO5 · Gerador de Conteúdo"
          className={inputCls}
        />
      </Campo>
      <Campo label="Introdução">
        <textarea rows={3} value={f.intro} onChange={(e) => set({ intro: e.target.value })} className={cn(inputCls, 'resize-y leading-normal')} />
      </Campo>
    </Modal>
  )
}
