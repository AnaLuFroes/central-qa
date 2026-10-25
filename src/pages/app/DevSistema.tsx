import { Main, Voltar } from '@/components/AppHeader'
import { Progresso } from '@/components/qa'
import { useIr } from '@/hooks/useIr'
import { useSistema } from '@/hooks/useSessao'
import { fmtData, plural } from '@/lib/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selLoteStats, selLotes } from '@/store/slices/selectors'
import { setFRep } from '@/store/slices/ui'

/** Página do dev em um sistema: os lotes que o QA enviou, com o que ainda espera resposta primeiro. */
export default function DevSistema() {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const sistema = useSistema()
  const stats = useAppSelector(selLoteStats)
  const lotes = useAppSelector(selLotes)
    .map((l) => ({ l, st: stats[l.id] ?? { total: 0, dn: 0, pend: 0, pct: 0 } }))
    .sort((a, b) => Number(b.st.pend > 0) - Number(a.st.pend > 0))
  const kPend = lotes.reduce((a, x) => a + x.st.pend, 0)
  const kTot = lotes.reduce((a, x) => a + x.st.total, 0)
  const kL = lotes.filter((x) => x.st.pend).length
  const kpis: [number, string, string][] = [
    [kPend, 'aguardando você', 'text-q-warn'],
    [kTot - kPend, 'respondidos', 'text-q-ok'],
    [kL, 'lotes em aberto', 'text-q-accent'],
  ]
  return (
    <>
      <header className="relative overflow-hidden bg-hero pt-8 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
        <div className="relative mx-auto max-w-[1168px] px-5">
          <div className="mb-[18px] flex flex-wrap items-center gap-3.5">
            <span className="[&>button]:mb-0">
              <Voltar onClick={ir.sistemas}>Sistemas</Voltar>
            </span>
            <span className="font-mono text-[.8rem] tracking-[.14em] text-cyan">CORREÇÕES PARA O DESENVOLVIMENTO</span>
          </div>
          <h1 className="m-0 mb-3.5 w-fit max-w-full font-serif text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.12] font-bold text-brand">
            {sistema?.nome}
          </h1>
          <p className="m-0 max-w-[62ch] text-[1.1rem] leading-[1.65] text-pretty text-hero-text">
            Estes são os lotes que o QA enviou para você. Abra um lote e responda cada item: corrigido, sem reprodução, falta
            informação, comportamento esperado ou adiado.
          </p>
        </div>
      </header>
      <Main>
        <div className="relative -mt-[60px] flex flex-wrap gap-10 rounded-2xl border border-q-line bg-q-card px-7 py-6 shadow-card">
          {kpis.map(([n, l, c]) => (
            <div key={l}>
              <div className={'font-serif text-[2.2rem] leading-none font-bold ' + c}>{n}</div>
              <div className="mt-2 text-base text-q-muted">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-baseline justify-between gap-3 border-b-2 border-[#5B45C8] pb-2">
          <h2 className="m-0 font-serif text-[1.35rem] font-semibold">Lotes enviados pelo QA</h2>
          <span className="font-mono text-[.8rem] text-q-muted">{plural(lotes.length, 'lote', 'lotes')}</span>
        </div>
        {!lotes.length && <p className="m-0 py-10 text-center text-q-muted">Nenhum lote enviado para este sistema.</p>}
        <div className="mt-[18px] flex flex-col gap-3">
          {lotes.map(({ l, st }) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                dispatch(setFRep(st.pend ? 'open' : 'all'))
                ir.lote(l.id)
              }}
              className="flex w-full flex-col gap-1 rounded-xl border border-q-line bg-q-card px-[22px] py-[18px] text-left text-inherit shadow-[0_1px_2px_rgba(17,20,48,.04)] transition-colors hover:border-q-accent"
            >
              <span className="flex w-full flex-wrap items-center gap-2.5">
                <span className="font-serif text-[1.2rem] font-bold">{l.titulo}</span>
                {st.pend > 0 ? (
                  <span className="rounded-full bg-q-warn-bg px-2.5 py-0.5 text-[.78rem] font-semibold text-q-warn">
                    {st.pend} aguardando você
                  </span>
                ) : (
                  <span className="rounded-full bg-q-ok-bg px-2.5 py-0.5 text-[.78rem] font-semibold text-q-ok">Tudo respondido</span>
                )}
                <span className="flex-1" />
                <span className="text-[.95rem] font-semibold text-q-accent">
                  {st.dn === 0 ? 'Começar' : st.pend ? 'Continuar' : 'Revisar'} →
                </span>
              </span>
              <span className="text-[.9rem] text-q-muted">
                {(l.eyebrow ? l.eyebrow + ' · ' : '') + 'enviado em ' + fmtData(l.criadoEm) + ' · ' + st.dn + ' de ' + st.total + ' respondidos'}
              </span>
              <Progresso pct={st.pct} alto={6} className="mt-2.5 w-full" />
            </button>
          ))}
        </div>
      </Main>
    </>
  )
}
