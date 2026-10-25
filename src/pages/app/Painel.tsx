import type { ReactNode } from 'react'
import { AppHeader, Main } from '@/components/AppHeader'
import { ModuleBadge } from '@/components/ModuleCover'
import { Progresso, SegBar } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { useIr } from '@/hooks/useIr'
import { useOcorrenciaAcoes } from '@/hooks/useOcorrenciaAcoes'
import { useSessao, useSistema } from '@/hooks/useSessao'
import { fmtData, hojeEyebrow, modOf, plural, saudacao } from '@/lib/format'
import { FILA_KIND, contar, fila, flowBar, porModulo, rodStats, type ItemFila, type KindFila } from '@/lib/painel'
import { RESP, STATUS, respFix, type StatusVisivel } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selComStatus, selFeatures, selLoteStats, selLotes, selModulos, selRodadas } from '@/store/slices/selectors'
import { setFRep, setFRod, setPainelF, type FiltroFila } from '@/store/slices/ui'
import type { Lote } from '@/types'

const Ico = ({ children, w = 18 }: { children: ReactNode; w?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)
const IcoReab = ({ w }: { w?: number }) => (
  <Ico w={w}>
    <path d="M4 12a8 8 0 1 0 2.3-5.6" />
    <path d="M4 4v4h4" />
  </Ico>
)
const ICONES: Record<KindFila, ReactNode> = {
  resp: (
    <Ico>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </Ico>
  ),
  ret: (
    <Ico>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4h-4" />
      <path d="M9 12l2 2 4-4" />
    </Ico>
  ),
  reab: <IcoReab />,
  reg: (
    <Ico>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Ico>
  ),
}

const cardCls = 'rounded-3xl border border-q-line bg-q-card'

export default function Painel() {
  const { nome } = useSessao()
  const sistema = useSistema()
  const all = useAppSelector(selComStatus)
  const feats = useAppSelector(selFeatures)
  const itens = fila(all, feats)
  const sub =
    saudacao(nome) +
    '. ' +
    (itens.length ? plural(itens.length, 'item precisa', 'itens precisam') + ' de você agora.' : 'Nada esperando por você agora.')
  return (
    <>
      <AppHeader eyebrow={'VISÃO GERAL · ' + hojeEyebrow()} titulo={sistema?.nome ?? ''} sub={sub} />
      <Main>
        <Fluxo />
        <div className="mt-7 flex flex-wrap items-start gap-6">
          <Fila itens={itens} />
          <aside className="flex max-w-[400px] flex-[1_1_300px] flex-col gap-5">
            <ModulosPendentes />
            <UltimaRodada />
            <UltimosLotes />
          </aside>
        </div>
      </Main>
    </>
  )
}

function Fluxo() {
  const all = useAppSelector(selComStatus)
  const dispatch = useAppDispatch()
  const ir = useIr()
  const c = (k: StatusVisivel) => contar(all, k)
  const filtrar = (k: FiltroFila) => () => dispatch(setPainelF(k))
  const passos: [StatusVisivel, string, string, () => void, number][] = [
    ['aberto', 'Não enviadas', 'Ver módulos', ir.modulos, c('aberto')],
    ['enviado', 'Com o dev', 'Ver lotes', ir.lotes, c('enviado')],
    ['retorno', 'Dev respondeu', 'Filtrar a fila', filtrar('resp'), c('retorno') + c('adiada')],
    ['reteste', 'Aguardando reteste', 'Filtrar a fila', filtrar('ret'), c('reteste')],
    ['validado', 'Validadas', 'Filtrar a fila', filtrar('reg'), c('validado')],
  ]
  const reab = c('reaberto')
  return (
    <section
      aria-label="Fluxo das ocorrências"
      className="relative -mt-[76px] rounded-3xl border border-q-line bg-q-card px-[26px] pt-[22px] pb-5 shadow-float"
    >
      <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 font-serif text-[1.15rem] font-bold">Fluxo das ocorrências</h2>
        <span className="font-mono text-[.78rem] text-q-muted">{plural(all.length, 'ocorrência', 'ocorrências')} neste sistema</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-y-3.5">
        {passos.map(([k, label, hint, go, n], i) => (
          <button
            key={k}
            type="button"
            onClick={go}
            title={hint}
            className="flex flex-col items-start gap-1 rounded-xl bg-transparent p-0 text-left text-inherit transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span className="mb-1.5 flex w-full items-center gap-2">
              <span className="size-3 flex-none rounded-full" style={{ background: STATUS[k][1], boxShadow: `0 0 0 5px ${STATUS[k][2]}` }} />
              <span className={cn('h-0.5 flex-1 rounded-sm', i < passos.length - 1 ? 'bg-q-line' : 'bg-transparent')} />
            </span>
            <span className="font-serif text-[2.4rem] leading-none font-bold" style={{ color: STATUS[k][1] }}>
              {n}
            </span>
            <span className="text-[.95rem] text-q-muted">{label}</span>
          </button>
        ))}
      </div>
      <SegBar segs={flowBar(all)} alto={8} className="mt-5 gap-[3px] [&>span]:transition-[width] [&>span]:duration-600" />
      {reab > 0 && (
        <button
          type="button"
          onClick={() => dispatch(setPainelF('reab'))}
          className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-q-red-bg px-3 py-[5px] text-[.86rem] font-semibold text-q-red"
        >
          <IcoReab w={15} />
          {plural(reab, 'ocorrência reaberta voltou', 'ocorrências reabertas voltaram')} para a fila
        </button>
      )}
    </section>
  )
}

const CHIPS: [FiltroFila, string][] = [
  ['all', 'Tudo'],
  ['resp', 'Respostas'],
  ['ret', 'Reteste'],
  ['reab', 'Reabertas'],
  ['reg', 'Regressão'],
]

function Fila({ itens }: { itens: ItemFila[] }) {
  const dispatch = useAppDispatch()
  const painelF = useAppSelector((s) => s.ui.painelF)
  const pF = painelF === 'all' || itens.some((x) => x.kind === painelF) ? painelF : 'all'
  const shown = itens.filter((x) => pF === 'all' || x.kind === pF)
  const chips = CHIPS.map(([k, l]) => ({ k, l, n: k === 'all' ? itens.length : itens.filter((x) => x.kind === k).length })).filter(
    (c) => c.n > 0 || c.k === 'all',
  )
  return (
    <section aria-label="Sua fila" className={cn(cardCls, 'min-w-0 flex-[999_1_520px] overflow-hidden')}>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-q-line px-[22px] py-[18px]">
        <h2 className="m-0 font-serif text-[1.25rem] font-bold">Agora é com você</h2>
        <span className="rounded-full bg-[linear-gradient(100deg,#8FF0F2,#C39BF5)] px-[9px] py-px font-mono text-[.75rem] font-semibold text-navy-deep">
          {itens.length}
        </span>
        <span className="flex-1" />
        <div role="tablist" aria-label="Filtrar fila" className="flex flex-wrap gap-1">
          {chips.map((c) => {
            const on = pF === c.k
            return (
              <button
                key={c.k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => dispatch(setPainelF(c.k))}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[.84rem] font-medium transition-colors',
                  on ? 'border-q-chip bg-q-chip text-white' : 'border-q-line bg-transparent text-q-muted',
                )}
              >
                {c.l}
                <span className="font-mono text-[.7rem] opacity-80">{c.n}</span>
              </button>
            )
          })}
        </div>
      </div>
      {!shown.length && (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="grid size-[52px] place-items-center rounded-2xl bg-q-ok-bg text-q-ok">
            <Ico w={24}>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </Ico>
          </span>
          <p className="m-0 mt-1.5 text-[1.05rem] font-semibold">Tudo em dia por aqui</p>
          <p className="m-0 max-w-[44ch] text-[.92rem] text-q-muted">
            Quando o dev responder um item, ou algo voltar para reteste, ele aparece nesta fila.
          </p>
        </div>
      )}
      <div className="flex flex-col">
        {shown.map((x) => (
          <LinhaFila key={x.kind + x.f.id} x={x} />
        ))}
      </div>
    </section>
  )
}

function LinhaFila({ x }: { x: ItemFila }) {
  const { kind, f } = x
  const ir = useIr()
  const acoes = useOcorrenciaAcoes()
  const lotes = useAppSelector((s) => s.data.lotes)
  const resp = useAppSelector((s) => s.data.respostas)
  const r = kind === 'resp' || kind === 'ret' ? respFix(f, lotes, resp) : null
  const lote = f.loteId ? lotes.find((l) => l.id === f.loteId) : undefined
  const [lbl, cor, bg] = FILA_KIND[kind]
  const rotulo = kind === 'resp' ? 'DEV: ' + (r?.st ? RESP[r.st][0] : 'respondeu').toUpperCase() : lbl
  const abrir = () => ir.fix(f)
  const btnLinha = 'font-medium whitespace-nowrap'
  return (
    <article className="flex items-start gap-3.5 border-b border-q-line px-[22px] py-4 transition-colors duration-200 hover:bg-q-bg">
      <span className="grid size-[38px] flex-none place-items-center rounded-[11px]" style={{ background: bg, color: cor }}>
        {ICONES[kind]}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="flex flex-wrap items-center gap-2 text-[.78rem]">
          <b className="font-mono font-semibold tracking-[.06em]" style={{ color: cor }}>
            {rotulo}
          </b>
          {f.cod && <span className="font-mono text-q-muted">{f.cod}</span>}
          <span className="text-q-muted">{modOf(f) + (lote ? ' · lote “' + lote.titulo + '”' : '')}</span>
        </span>
        <button
          type="button"
          onClick={abrir}
          className="bg-transparent p-0 text-left text-base leading-[1.4] font-semibold text-inherit hover:text-q-accent"
        >
          {f.titulo}
        </button>
        {kind === 'resp' && r?.com && (
          <span className="mt-0.5 border-l-2 border-q-line pl-2.5 text-[.9rem] text-q-muted">{r.com}</span>
        )}
        {kind === 'ret' && r?.pr && <span className="font-mono text-[.78rem] text-q-accent">Corrigido em {r.pr}</span>}
      </div>
      <div className="flex flex-none flex-wrap justify-end gap-1.5 self-center">
        {kind === 'resp' && (
          <Button variant="primario" size="mini" onClick={abrir}>
            Responder
          </Button>
        )}
        {kind === 'ret' && (
          <>
            <Button variant="perigo" size="mini" className={btnLinha} onClick={() => void acoes.reabrir(f)}>
              Reabrir
            </Button>
            <Button size="mini" className="rounded-md bg-[#0F7A55] font-semibold text-white hover:brightness-110" onClick={() => void acoes.validar(f)}>
              Validar
            </Button>
          </>
        )}
        {kind === 'reab' && (
          <Button variant="linha" size="mini" className={btnLinha} onClick={abrir}>
            Abrir
          </Button>
        )}
        {kind === 'reg' && (
          <Button variant="primario" size="mini" onClick={() => void acoes.regressao(f)}>
            Criar regressão
          </Button>
        )}
      </div>
    </article>
  )
}

function ModulosPendentes() {
  const ir = useIr()
  const all = useAppSelector(selComStatus)
  const mods = useAppSelector(selModulos)
  const lista = porModulo(
    all,
    mods.map((m) => m.nome),
  )
  return (
    <section className={cn(cardCls, 'px-[18px] pt-[18px] pb-3')}>
      <div className="mx-1 mb-2.5 flex items-baseline justify-between gap-2.5">
        <h3 className="m-0 font-serif text-[1.1rem] font-bold">Módulos com pendências</h3>
        <button type="button" onClick={ir.modulos} className="bg-transparent p-0 text-[.85rem] font-semibold text-q-accent">
          Ver todos
        </button>
      </div>
      {!lista.length && <p className="mx-1 mt-0 mb-2 text-[.92rem] text-q-muted">Nenhuma pendência neste sistema.</p>}
      <div className="flex flex-col gap-0.5">
        {lista.map((x) => {
          const m = mods.find((y) => y.nome === x.nome)
          return (
            <button
              key={x.nome}
              type="button"
              onClick={() => ir.modulo(x.nome)}
              className="flex w-full items-center gap-3 rounded-xl bg-transparent p-2 text-left text-inherit transition-colors duration-200 hover:bg-q-bg"
            >
              <ModuleBadge nome={x.nome} emoji={m?.emoji ?? ''} cor={m?.cor ?? null} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex justify-between gap-2">
                  <span className="text-[.95rem] font-semibold">{x.nome}</span>
                  <span className="font-mono text-[.8rem] text-q-accent">{x.tot}</span>
                </span>
                <Progresso pct={x.pct} alto={5} />
                <span className="text-[.78rem] text-q-muted">{x.meta}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function UltimaRodada() {
  const ir = useIr()
  const dispatch = useAppDispatch()
  const r = useAppSelector(selRodadas)[0]
  if (!r) return null
  const st = rodStats(r)
  const w = (n: number) => (st.t ? (n / st.t) * 100 : 0) + '%'
  return (
    <section className={cn(cardCls, 'px-[22px] py-[18px]')}>
      <h3 className="m-0 mb-3 font-serif text-[1.1rem] font-bold">Última rodada de teste</h3>
      <button
        type="button"
        onClick={() => {
          dispatch(setFRod('all'))
          ir.rodada(r.id)
        }}
        className="flex w-full flex-col gap-2 bg-transparent p-0 text-left text-inherit"
      >
        <span className="text-[.95rem] font-semibold">{r.nome}</span>
        <span className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-q-track">
          <span style={{ width: w(st.p), background: '#0F7A55' }} />
          <span style={{ width: w(st.f), background: '#B42336' }} />
          <span style={{ width: w(st.b), background: '#E0A33A' }} />
        </span>
        <span className="text-[.8rem] text-q-muted">{st.counts}</span>
      </button>
    </section>
  )
}

const metaLote = (l: Lote, dn: number, total: number) =>
  (l.eyebrow ? l.eyebrow + ' · ' : '') + fmtData(l.criadoEm) + ' · ' + dn + ' de ' + total + ' respondidos pelo dev'

function UltimosLotes() {
  const ir = useIr()
  const dispatch = useAppDispatch()
  const lotes = useAppSelector(selLotes).slice(0, 3)
  const stats = useAppSelector(selLoteStats)
  if (!lotes.length) return null
  return (
    <section className={cn(cardCls, 'px-[22px] py-[18px]')}>
      <h3 className="m-0 mb-3 font-serif text-[1.1rem] font-bold">Últimos lotes</h3>
      <div className="flex flex-col gap-3.5">
        {lotes.map((l) => {
          const st = stats[l.id]
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                dispatch(setFRep('all'))
                ir.lote(l.id)
              }}
              className="flex w-full flex-col gap-1 bg-transparent p-0 text-left text-inherit"
            >
              <span className="text-[.95rem] font-semibold">{l.titulo}</span>
              <span className="text-[.8rem] text-q-muted">{metaLote(l, st?.dn ?? 0, st?.total ?? 0)}</span>
              <Progresso pct={st?.pct ?? 0} alto={5} className="w-full" />
            </button>
          )
        })}
      </div>
    </section>
  )
}
