import { Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Main } from '@/components/AppHeader'
import { Carregando } from '@/components/Carregando'
import { Conversa, RespostaQA } from '@/components/Conversa'
import { FixBody } from '@/components/FixBody'
import { Alta, CabecalhoAssunto, Check, FixCard, TituloFix } from '@/components/FixCard'
import { RespostaDev } from '@/components/RespostaDev'
import { Chips, CodTag, Pill, Progresso } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { useIr } from '@/hooks/useIr'
import { useSessao } from '@/hooks/useSessao'
import { agruparPorAssunto, type ItemAgrupado } from '@/lib/assuntos'
import { baixarLote } from '@/lib/exportLote'
import { fixCode } from '@/lib/format'
import { temRegressao } from '@/lib/painel'
import { RESP, loteStats, respOf, rotuloItem, stOf } from '@/lib/status'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selFeatures, selRespostas } from '@/store/slices/selectors'
import { setFRep, setRecolhidos, toggleRecolhido, type FiltroRep } from '@/store/slices/ui'
import type { ItemLote, Lote as TLote } from '@/types'

const INTRO_DEV =
  'Cada item traz onde acontece, como reproduzir, as evidências e o que se espera. Responda item a item: o QA recebe sua resposta e faz o reteste.'

export default function Lote() {
  const { sis, id } = useParams()
  const { isDev } = useSessao()
  const lote = useAppSelector((s) => s.data.lotes.find((l) => l.id === id))
  const carregado = useAppSelector((s) => s.data.carregado.lotes)
  if (!lote) return carregado ? <Navigate to={`/s/${sis}/${isDev ? 'dev' : 'lotes'}`} replace /> : <Carregando />
  if (lote.sis !== sis) return <Navigate to={`/s/${lote.sis}/lotes/${lote.id}`} replace />
  return <PaginaLote l={lote} isDev={isDev} />
}

function PaginaLote({ l, isDev }: { l: TLote; isDev: boolean }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const { orgId } = useSessao()
  const resp = useAppSelector(selRespostas)
  const fRep = useAppSelector((s) => s.ui.fRep)
  const recolhidos = useAppSelector((s) => s.ui.recolhidos)
  const st = loteStats(l, resp)
  const dm = resp[l.id] ?? {}
  const feito = (k: string) => !!dm[k]?.st

  const secoes = l.secoes
    .map((sc) => {
      const sd = sc.itens.filter((it) => feito(it.key)).length
      const itens = sc.itens.filter((it) => fRep === 'all' || (fRep === 'done' ? feito(it.key) : !feito(it.key)))
      return { nome: sc.nome, sd, total: sc.itens.length, itens: agruparPorAssunto(itens, true, ['item', 'itens']) }
    })
    .filter((sc) => sc.itens.length)
  const cks = secoes.flatMap((sc) => sc.itens.map((x) => l.id + '/' + x.item.key))
  const tudoRecolhido = cks.length > 0 && cks.every((k) => recolhidos[k])
  const chips: { k: FiltroRep; label: string }[] = [
    { k: 'all', label: 'Todos' },
    { k: 'open', label: isDev ? 'Aguardando você' : 'Sem resposta' },
    { k: 'done', label: 'Respondidos' },
  ]
  const btn = 'bg-transparent font-medium text-[.9rem]'
  const baixar = async () => {
    try {
      await baixarLote(orgId, l, resp)
      toast('Arquivo “' + l.titulo + '.html” baixado')
    } catch (e) {
      toast.error('Não foi possível gerar o arquivo. ' + ((e as Error)?.message ?? ''))
    }
  }

  return (
    <>
      <header className="relative overflow-hidden bg-hero pt-11 pb-[72px] text-white">
        <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
        <div className="relative mx-auto max-w-[1168px] px-5">
          {l.eyebrow && <p className="m-0 mb-3 font-mono text-[.8rem] tracking-[.06em] text-cyan">{l.eyebrow}</p>}
          <h1 className="m-0 mb-3 w-fit max-w-full font-serif text-[clamp(1.9rem,4.5vw,2.8rem)] leading-[1.12] font-bold text-brand">
            {l.titulo}
          </h1>
          <p className="m-0 max-w-[62ch] text-[1.05rem] text-hero-text">{isDev ? INTRO_DEV : l.intro}</p>
        </div>
      </header>
      <Main>
        <div className="relative -mt-11 rounded-[14px] border border-q-line bg-q-card px-[22px] py-5 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="font-serif text-[2.1rem] leading-none font-bold text-q-accent">
              {st.dn}
              <small className="ml-2 font-sans text-[.95rem] font-medium text-q-muted">
                de {st.total} {isDev ? 'itens respondidos por você' : 'itens respondidos pelo dev'}
              </small>
            </div>
            <div className="font-mono text-[.82rem] text-q-muted">{st.pct}%</div>
          </div>
          <Progresso pct={st.pct} alto={10} className="mt-3.5" />
        </div>

        <div role="toolbar" className="sticky top-16 z-5 mt-3.5 flex flex-wrap items-center gap-2 border-b border-q-line bg-q-bg py-3.5">
          <Button variant="linha" size="mini" className="font-medium text-[.9rem]" onClick={isDev ? ir.dev : ir.lotes}>
            Voltar
          </Button>
          <Chips itens={chips} valor={fRep} onChange={(k) => dispatch(setFRep(k))} label="Filtrar itens" />
          <span className="flex-1" />
          <Button
            variant="linha"
            size="mini"
            className={btn}
            onClick={() => dispatch(setRecolhidos({ keys: cks, recolher: !tudoRecolhido }))}
          >
            {tudoRecolhido ? 'Expandir tudo' : 'Recolher tudo'}
          </Button>
          {!isDev && (
            <>
              <Button variant="linha" size="mini" className={btn} onClick={() => dispatch(abrirModal({ kind: 'link', loteId: l.id }))}>
                Copiar link
              </Button>
              <Button variant="linha" size="mini" className={btn} onClick={() => void baixar()}>
                Baixar HTML
              </Button>
            </>
          )}
        </div>

        {secoes.map((sc) => (
          <section key={sc.nome} className="mt-[34px]">
            <div className="mb-3.5 flex items-baseline justify-between gap-3 border-b-2 border-[#5B45C8] pb-2">
              <h2 className="m-0 font-serif text-[1.35rem] font-semibold">{sc.nome}</h2>
              <span className={'font-mono text-[.8rem] whitespace-nowrap ' + (sc.sd === sc.total ? 'text-q-ok' : 'text-q-muted')}>
                {sc.sd} de {sc.total}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {sc.itens.map((x) => (
                <ItemDoLote key={x.item.key} l={l} x={x} isDev={isDev} />
              ))}
            </div>
          </section>
        ))}
        {!secoes.length && (
          <p className="m-0 py-10 text-center text-q-muted">
            {fRep === 'done' ? 'Nenhum item respondido ainda.' : 'Todos os itens deste lote já foram respondidos.'}
          </p>
        )}
      </Main>
    </>
  )
}

function ItemDoLote({ l, x, isDev }: { l: TLote; x: ItemAgrupado<ItemLote>; isDev: boolean }) {
  const it = x.item
  const ck = l.id + '/' + it.key
  const dispatch = useAppDispatch()
  const resp = useAppSelector(selRespostas)
  const feats = useAppSelector(selFeatures)
  const aberto = useAppSelector((s) => !s.ui.recolhidos[ck])
  // O dev não carrega as ocorrências: para ele não há "reaberta" nem "validada".
  const live = useAppSelector((s) => (isDev ? undefined : s.data.ocorrencias.find((o) => o.id === it.ocorrenciaId)))
  const r = respOf(resp, l.id, it.key)
  const reab = !!live?.hist.some((h) => h.ev === 'reaberto' && h.loteId === l.id)
  const valid = live?.status === 'validado' && live.loteId === l.id
  const lab = rotuloItem(r, reab, valid)
  const done = r?.st === 'corrigido'
  const ok = done || valid
  const barra = ok ? 'var(--cqa-ok)' : r?.st ? RESP[r.st][1] : 'var(--brand-gradient-v)'
  const noLote = !!live && live.loteId === l.id
  return (
    <>
      {x.head && <CabecalhoAssunto a={x.assunto} txt={x.grpTxt} primeiro={x.first} />}
      <FixCard
        raio={10}
        barra={barra}
        apagado={ok}
        aberto={aberto}
        onToggle={() => dispatch(toggleRecolhido(ck))}
        marcador={
          <button
            type="button"
            onClick={() => dispatch(toggleRecolhido(ck))}
            aria-label={lab[0]}
            className="mt-px grid size-6 flex-none place-items-center rounded-md border-2 p-0 text-white transition-colors duration-150"
            style={{ borderColor: ok ? 'var(--cqa-ok)' : lab[1], background: ok ? 'var(--cqa-ok)' : 'var(--cqa-card)' }}
          >
            {done && <Check size={13} />}
          </button>
        }
        cabecalho={
          <>
            <CodTag className={done ? 'bg-q-ok-bg text-q-ok' : 'bg-q-soft text-q-accent'}>{it.cod || fixCode(it.key)}</CodTag>
            <TituloFix>{it.titulo || 'Sem título'}</TituloFix>
            <Pill cor={lab} />
            {it.prioridade === 'alta' && <Alta />}
          </>
        }
      >
        <FixBody f={it} />
        <Conversa r={r} />
        {noLote && live && (
          <RespostaQA f={live} st={stOf(live, r)} r={r} temReg={temRegressao(live, feats)} />
        )}
        {isDev && <RespostaDev sis={l.sis} loteId={l.id} k={it.key} r={r} fechado={reab || valid} />}
      </FixCard>
    </>
  )
}
