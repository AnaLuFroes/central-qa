import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/FixCard'
import { inputCls } from '@/components/qa'
import { responderComoDev } from '@/data/respostas'
import { useSessao } from '@/hooks/useSessao'
import { RESP, RESP_KEYS, RESP_PH } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setDraftResposta, type DraftResposta } from '@/store/slices/drafts'
import type { Resposta } from '@/types'

/**
 * Painel "Sua resposta para o QA" do dev, ou o botão "Alterar resposta" depois de respondido.
 * Some quando o QA já validou ou reabriu o item.
 */
export function RespostaDev({ sis, loteId, k, r, fechado }: { sis: string; loteId: string; k: string; r: Resposta | null; fechado: boolean }) {
  const { orgId, nome } = useSessao()
  const dispatch = useAppDispatch()
  const ck = loteId + '/' + k
  const draft = useAppSelector((s) => s.drafts.respostas[ck])
  const [err, setErr] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendente = !r?.st
  if (fechado) return null

  const set = (p: Partial<DraftResposta>) => {
    setErr('')
    dispatch(setDraftResposta({ ck, v: { ...(draft ?? { st: null, pr: '', com: '' }), ...p } }))
  }
  const limpar = () => {
    setErr('')
    dispatch(setDraftResposta({ ck, v: null }))
  }

  if (!pendente && !draft)
    return (
      <div className="mt-3">
        <Button variant="linha" size="mini" className="font-medium" onClick={() => set({ st: r!.st, pr: r!.pr, com: r!.com })}>
          Alterar resposta
        </Button>
      </div>
    )

  const d = draft ?? { st: null, pr: '', com: '' }
  const enviar = async () => {
    if (!d.st) return setErr('Escolha uma resposta.')
    const pr = d.pr.trim()
    const com = d.com.trim()
    if (d.st === 'corrigido' && !pr) return setErr('Informe o PR, a branch ou o commit da correção.')
    if (d.st !== 'corrigido' && !com) return setErr('Escreva um comentário para o QA.')
    setEnviando(true)
    try {
      await responderComoDev(orgId, sis, loteId, k, { st: d.st, pr, com }, nome)
      limpar()
      toast('Resposta enviada ao QA')
    } catch (e) {
      setErr('Não foi possível enviar. ' + ((e as Error)?.message ?? ''))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mt-[18px] max-w-[74ch] rounded-xl border border-q-line bg-q-bg px-4 py-3.5">
      <p className="m-0 mb-2.5 text-[.95rem] font-semibold">Sua resposta para o QA</p>
      <div className="mb-2.5 flex flex-wrap gap-2">
        {RESP_KEYS.map((k2) => {
          const on = d.st === k2
          return (
            <button
              key={k2}
              type="button"
              aria-pressed={on}
              onClick={() => set({ st: k2 })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[.85rem] font-medium transition-colors',
                on ? 'border-q-chip bg-q-chip text-white' : 'border-q-line bg-q-card text-q-muted hover:border-q-accent hover:text-q-accent',
              )}
            >
              {on && <Check />}
              {RESP[k2][0]}
            </button>
          )
        })}
      </div>
      {d.st === 'corrigido' && (
        <input
          value={d.pr}
          onChange={(e) => set({ pr: e.target.value })}
          aria-label="PR, branch ou commit"
          placeholder="PR, branch ou commit (ex.: PR #131 · fix/card-sem-imagem)"
          className={cn(inputCls, 'mb-2 bg-q-card font-mono text-[.88rem]')}
        />
      )}
      <textarea
        rows={2}
        value={d.com}
        onChange={(e) => set({ com: e.target.value })}
        aria-label="Comentário"
        placeholder={d.st ? RESP_PH[d.st] : 'Comentário para o QA.'}
        className={cn(inputCls, 'resize-y bg-q-card text-[.94rem] leading-normal')}
      />
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {err && <span className="mr-auto text-[.86rem] text-q-red">{err}</span>}
        <span className="flex-1" />
        {draft && !pendente && (
          <Button variant="linha" size="mini" className="font-medium" onClick={limpar}>
            Cancelar
          </Button>
        )}
        <Button variant="primario" size="mini" disabled={enviando} onClick={() => void enviar()}>
          Enviar resposta
        </Button>
      </div>
    </div>
  )
}
