import { Navigate, useParams } from 'react-router-dom'
import { Voltar } from '@/components/AppHeader'
import { Chevron, GherkinView, TagFuncionalidade } from '@/components/GherkinView'
import { Chips, Eyebrow, Pill, SegBar } from '@/components/qa'
import { definirResultado } from '@/data/rodadas'
import { useIr } from '@/hooks/useIr'
import { useExecutar, useSessao, useSistema } from '@/hooks/useSessao'
import { fmtData, plural } from '@/lib/format'
import { ocorrenciaDaFalha } from '@/lib/gherkin'
import { COR_RES, rodStats, segsRodada } from '@/lib/painel'
import { RES, STATUS, respFix, stOf } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selFeatures, selModulos, selOcorrencias, selRodadas } from '@/store/slices/selectors'
import { setFRod, toggleScen, type FiltroRod } from '@/store/slices/ui'
import type { ItemRodada, ResSt, Rodada as TRodada } from '@/types'

const CHIPS: { k: FiltroRod; label: string }[] = [
  { k: 'all', label: 'Todos' },
  { k: 'pend', label: 'Pendentes' },
  { k: 'passou', label: 'Passou' },
  { k: 'falhou', label: 'Falhou' },
  { k: 'bloqueado', label: 'Bloqueado' },
]

export default function Rodada() {
  const { id, sis } = useParams()
  const ir = useIr()
  const dispatch = useAppDispatch()
  const sistema = useSistema()
  const rodadas = useAppSelector(selRodadas)
  const carregado = useAppSelector((s) => s.data.carregado.rodadas)
  const mods = useAppSelector(selModulos)
  const fRod = useAppSelector((s) => s.ui.fRod)
  const r = rodadas.find((x) => x.id === id)

  if (!r) return carregado ? <Navigate to={`/s/${sis}/casos`} replace /> : null

  const st = rodStats(r)
  const order = mods.map((m) => m.nome)
  const gm = new Map<string, Map<string, { nome: string; itens: ItemRodada[] }>>()
  for (const it of r.itens) {
    const stt = r.res[it.key]?.st ?? 'pend'
    if (fRod !== 'all' && fRod !== stt) continue
    if (!gm.has(it.modulo)) gm.set(it.modulo, new Map())
    const fm = gm.get(it.modulo)!
    if (!fm.has(it.featId)) fm.set(it.featId, { nome: it.featNome, itens: [] })
    fm.get(it.featId)!.itens.push(it)
  }
  const grupos = [...gm.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
  const legenda: [string, number, string][] = [
    ['Passou', st.p, 'var(--cqa-ok)'],
    ['Falhou', st.f, 'var(--cqa-red)'],
    ['Bloqueado', st.b, COR_RES.bloqueado],
    ['Pendente', st.pend, '#C9C7E6'],
  ]

  return (
    <>
      <header className="relative overflow-hidden bg-auth pt-8 pb-[72px] text-white">
        <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
        <div className="relative mx-auto max-w-[1168px] px-5">
          <Voltar onClick={() => ir.casos('rodadas')}>Rodadas de teste</Voltar>
          <Eyebrow className="mt-0 mb-2.5 text-[.8rem] tracking-[.08em]">{((sistema?.nome ?? '') + ' · RODADA DE TESTE').toUpperCase()}</Eyebrow>
          <h1 className="m-0 mb-2.5 w-fit max-w-full font-serif text-[clamp(1.9rem,4.5vw,2.8rem)] leading-[1.12] font-bold text-brand">{r.nome}</h1>
          <p className="m-0 text-[1.05rem] text-hero-text">
            {plural(st.t, 'cenário', 'cenários') + ' · criada em ' + fmtData(r.criadoEm) + (r.amb ? ' · testada em ' + r.amb : '')}
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1168px] flex-1 px-5 pb-16">
        <div className="relative -mt-11 rounded-[14px] border border-q-line bg-q-card px-[22px] py-5 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="font-serif text-[2.1rem] leading-none font-bold text-q-accent">
              {st.exec}
              <small className="ml-2 font-sans text-[.95rem] font-medium text-q-muted">de {st.t} cenários executados</small>
            </div>
            <div className="font-mono text-[.82rem] text-q-muted">{st.pct}%</div>
          </div>
          <SegBar segs={segsRodada(st)} alto={10} className="mt-3.5" />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {legenda.map(([l, n, c]) => (
              <span key={l} className="inline-flex items-center gap-[7px] text-[.9rem] text-q-muted">
                <span className="size-2.5 rounded-[3px]" style={{ background: c }} />
                {l}
                <b className="font-semibold text-q-ink">{n}</b>
              </span>
            ))}
          </div>
        </div>
        <div role="toolbar" className="sticky top-16 z-[5] mt-3.5 border-b border-q-line bg-q-bg py-3.5">
          <Chips itens={CHIPS} valor={fRod} onChange={(k) => dispatch(setFRod(k))} label="Filtrar cenários" />
        </div>
        {grupos.map(([nome, fm]) => {
          const feats = [...fm.entries()]
          return (
            <section key={nome} className="mt-[34px]">
              <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#5B45C8] pb-2">
                <h2 className="m-0 font-serif text-[1.35rem]">{nome}</h2>
                <span className="font-mono text-[.8rem] whitespace-nowrap text-q-muted">
                  {plural(feats.reduce((a, [, f]) => a + f.itens.length, 0), 'cenário', 'cenários')}
                </span>
              </div>
              {feats.map(([fid, f]) => (
                <div key={fid}>
                  <p className="mt-[18px] mb-2.5 flex flex-wrap items-baseline gap-2.5">
                    <TagFuncionalidade />
                    <span className="font-semibold">{f.nome}</span>
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {f.itens.map((it) => (
                      <Cenario key={it.key} r={r} it={it} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )
        })}
        {!grupos.length && <p className="m-0 py-10 text-center text-q-muted">Nenhum cenário neste filtro.</p>}
      </main>
    </>
  )
}

function Cenario({ r, it }: { r: TRodada; it: ItemRodada }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const { orgId } = useSessao()
  const executar = useExecutar()
  const ck = r.id + '/' + it.key
  const aberto = useAppSelector((s) => !!s.ui.openScen[ck])
  const fixes = useAppSelector(selOcorrencias)
  const feats = useAppSelector(selFeatures)
  const lotes = useAppSelector((s) => s.data.lotes)
  const respostas = useAppSelector((s) => s.data.respostas)
  const x = r.res[it.key] ?? {}
  const stt = x.st ?? 'pend'
  const fx = x.fixId ? fixes.find((y) => y.id === x.fixId) : undefined
  const fst = fx ? STATUS[stOf(fx, respFix(fx, lotes, respostas))] : null

  const registrar = () => {
    const ft = feats.find((y) => y.id === it.featId)
    const ca = ft?.caId ? feats.find((y) => y.id === ft.caId) : undefined
    dispatch(abrirModal({ kind: 'fix', modulo: it.modulo, preset: ocorrenciaDaFalha(it, r.amb, ft, ca), origin: { rid: r.id, key: it.key } }))
  }
  const marcar = (k: ResSt) => {
    const on = stt === k
    void executar(definirResultado(orgId, r, it.key, k))
    if (k === 'falhou' && !on && !fx) registrar()
  }
  const linhas = [...(it.bg ?? []).map((l) => l.trim()), ...it.lines.map((l) => l.replace(/^ {4}/, ''))].join('\n')

  return (
    <article className="relative overflow-hidden rounded-[10px] border border-q-line bg-q-card">
      <span
        className="absolute inset-y-0 left-0 w-1 transition-[background] duration-200"
        style={{ background: stt === 'pend' ? 'var(--cqa-line)' : RES[stt][1] }}
      />
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 py-3 pr-4 pl-5">
        <button
          onClick={() => dispatch(toggleScen(ck))}
          aria-expanded={aberto}
          className="flex min-w-0 flex-[1_1_280px] items-baseline gap-2.5 text-left"
        >
          <Chevron aberto={aberto} size={14} className="self-center" />
          {it.outline && (
            <span className="rounded-[5px] bg-q-warn-bg px-1.5 py-0.5 font-mono text-[.7rem] font-semibold text-q-warn">ESQUEMA</span>
          )}
          <span className="leading-[1.4] font-semibold">{it.titulo}</span>
        </button>
        <div className="flex flex-none overflow-hidden rounded-md border border-q-line" role="group" aria-label="Resultado">
          {(Object.keys(RES) as ResSt[]).map((k) => {
            const on = stt === k
            return (
              <button
                key={k}
                onClick={() => marcar(k)}
                aria-pressed={on}
                className={cn(
                  'px-3 py-1.5 text-[.84rem] font-semibold shadow-[inset_1px_0_0_var(--cqa-line)] transition-[background] duration-150',
                  on ? 'text-q-card' : 'bg-q-card text-q-muted',
                )}
                style={on ? { background: RES[k][1] } : undefined}
              >
                {RES[k][0]}
              </button>
            )
          })}
        </div>
      </div>
      {fx && fst && (
        <div className="flex flex-wrap items-center gap-2 pr-4 pb-3 pl-11 text-[.88rem] text-q-muted">
          Ocorrência:
          <button onClick={() => ir.fix(fx)} className="text-left text-[.88rem] font-semibold text-q-accent hover:underline">
            {fx.titulo}
          </button>
          <Pill cor={fst} className="px-[9px] py-px text-[.76rem]" />
        </div>
      )}
      {stt === 'falhou' && !fx && (
        <div className="flex flex-wrap items-center gap-2.5 pr-4 pb-3 pl-11 text-[.88rem] text-q-red">
          Falhou sem ocorrência registrada.
          <button
            onClick={registrar}
            className="rounded-md border border-q-red-line px-2.5 py-1 text-[.84rem] font-medium text-q-red hover:border-q-red"
          >
            Registrar ocorrência
          </button>
        </div>
      )}
      {aberto && <GherkinView texto={linhas} numeros={false} className="mr-4 mb-3.5 ml-5" />}
    </article>
  )
}
