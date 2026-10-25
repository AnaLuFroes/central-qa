import { H4 } from '@/components/FixBody'
import { fmtDH } from '@/lib/format'
import { RESP, itemKey, respOf } from '@/lib/status'
import type { Lote, Ocorrencia, Respostas } from '@/types'

interface Evento {
  em: number
  txt: string
  semData?: boolean
}

/** Linha do tempo da ocorrência: registro, envios (pode ter passado por vários lotes), conversa e decisões do QA. */
function eventosOcorrencia(f: Ocorrencia, lotes: Lote[], resp: Respostas): Evento[] {
  const evs: Evento[] = []
  if (f.criadoEm) evs.push({ em: f.criadoEm, txt: 'Registrada' })
  for (const l of lotes) {
    const key = itemKey(l, f.id)
    if (!key) continue
    evs.push({ em: l.criadoEm, txt: 'Enviada ao dev no lote “' + l.titulo + '”' })
    for (const m of respOf(resp, l.id, key)?.thread ?? [])
      evs.push({
        em: m.em,
        txt: m.by === 'qa' ? 'QA respondeu ao dev' : 'Dev respondeu: ' + (m.st ? RESP[m.st][0] : '—') + (m.pr ? ' (' + m.pr + ')' : ''),
      })
  }
  for (const h of f.hist)
    evs.push({
      em: h.em,
      txt: h.ev === 'validado' ? 'Validada no reteste' : h.ev === 'encerrado' ? 'Encerrada sem correção' : 'Reaberta no reteste',
    })
  if (f.regFeatId) evs.push({ em: f.regEm ?? Date.now(), txt: 'Virou cenário de regressão', semData: !f.regEm })
  return evs.sort((a, b) => a.em - b.em)
}

export function Historico({ f, lotes, resp }: { f: Ocorrencia; lotes: Lote[]; resp: Respostas }) {
  const evs = eventosOcorrencia(f, lotes, resp)
  if (!evs.length) return null
  return (
    <>
      <H4 className="mb-2">Histórico</H4>
      <div className="ml-[5px] flex flex-col gap-2 border-l-2 border-q-line pl-4">
        {evs.map((ev, i) => (
          <div key={i} className="relative text-[.9rem] leading-[1.4]">
            <span className="absolute top-[5px] -left-[22px] size-2.5 rounded-full bg-[#5B45C8] shadow-[0_0_0_3px_var(--cqa-card)]" />
            {ev.txt}
            {!ev.semData && <span className="ml-2 text-[.82rem] text-q-muted">{fmtDH(ev.em)}</span>}
          </div>
        ))}
      </div>
    </>
  )
}
