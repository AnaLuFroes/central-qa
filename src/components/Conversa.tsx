import { Button } from '@/components/ui/button'
import { H4 } from '@/components/FixBody'
import { inputCls } from '@/components/qa'
import { useOcorrenciaAcoes } from '@/hooks/useOcorrenciaAcoes'
import { fmtDH } from '@/lib/format'
import { RESP, acoesFix, type StatusVisivel } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setReply } from '@/store/slices/drafts'
import type { Ocorrencia, Resposta } from '@/types'

/** Conversa entre dev e QA sobre um item do lote. */
export function Conversa({ r }: { r: Resposta | null }) {
  if (!r?.thread.length) return null
  return (
    <>
      <H4>Conversa com o dev</H4>
      <div className="flex max-w-[72ch] flex-col gap-2">
        {r.thread.map((m, i) => {
          const st = m.st ? RESP[m.st] : null
          const qa = m.by === 'qa'
          return (
            <div key={i} className={cn('rounded-[10px] border px-3 py-2.5', qa ? 'border-q-soft bg-q-soft' : 'border-q-line bg-q-card')}>
              <div className="flex flex-wrap items-center gap-2 text-[.82rem] text-q-muted">
                <b className="font-semibold text-q-ink">{qa ? 'QA' : 'Dev'}</b>
                {m.nome && <span>{m.nome}</span>}
                {st && (
                  <span className="rounded-full px-2.5 py-0.5 text-[.78rem] font-semibold" style={{ color: st[1], background: st[2] }}>
                    {st[0]}
                  </span>
                )}
                <span>{fmtDH(m.em)}</span>
              </div>
              {m.pr && <p className="m-0 mt-1.5 font-mono text-[.82rem] text-q-accent">{m.pr}</p>}
              {m.txt && <p className="m-0 mt-1.5 text-[.92rem]">{m.txt}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}

/** Caixa de resposta do QA ao dev (quando o dev respondeu sem corrigir) e "Encerrar sem correção". */
export function RespostaQA({ f, st, r, temReg }: { f: Ocorrencia; st: StatusVisivel; r: Resposta | null; temReg: boolean }) {
  const dispatch = useAppDispatch()
  const acoes = useOcorrenciaAcoes()
  const txt = useAppSelector((s) => s.drafts.replies[f.id] ?? '')
  const { canReply, canClose } = acoesFix(st, r, temReg)
  if (!canReply) return null
  return (
    <div className="mt-3 flex max-w-[72ch] flex-col gap-2">
      <textarea
        rows={2}
        value={txt}
        onChange={(e) => dispatch(setReply({ id: f.id, txt: e.target.value }))}
        placeholder="Responda ao dev: o que faltou, um vídeo, a massa de dados, a decisão do PO…"
        aria-label="Resposta ao dev"
        className={cn(inputCls, 'resize-y text-[.94rem] leading-normal')}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="primario" size="mini" onClick={() => void acoes.responder(f, txt)}>
          Responder ao dev
        </Button>
        {canClose && (
          <Button variant="linha" size="mini" className="font-medium" onClick={() => void acoes.encerrar(f)}>
            Encerrar sem correção
          </Button>
        )}
      </div>
    </div>
  )
}
