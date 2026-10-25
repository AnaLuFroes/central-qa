import { Navigate, useParams } from 'react-router-dom'
import { Main, Voltar } from '@/components/AppHeader'
import { Conversa, RespostaQA } from '@/components/Conversa'
import { FixBody } from '@/components/FixBody'
import { Alta, CabecalhoAssunto, Check, FixCard, TagAssunto, TituloFix } from '@/components/FixCard'
import { Historico } from '@/components/Historico'
import { Chips, CodTag, Pill, TipoTag } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { excluirOcorrencia } from '@/data/ocorrencias'
import { useIr } from '@/hooks/useIr'
import { useOcorrenciaAcoes } from '@/hooks/useOcorrenciaAcoes'
import { useArmar, useExecutar, useSessao } from '@/hooks/useSessao'
import { ASSUNTOS, agruparPorAssunto, assuntoOf, type ItemAgrupado } from '@/lib/assuntos'
import { modOf, plural } from '@/lib/format'
import { temRegressao } from '@/lib/painel'
import { STATUS, acoesFix, respFix, type StatusVisivel } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selComStatus, selFeatures, selLotes, selModulos, selOcorrencias } from '@/store/slices/selectors'
import {
  limparSelecao,
  selecionar,
  setFAss,
  setFTipo,
  setModGroup,
  toggleAberta,
  toggleSelecao,
  type FiltroTipo,
} from '@/store/slices/ui'
import type { Ocorrencia } from '@/types'

const TIPOS: { k: FiltroTipo; label: string }[] = [
  { k: 'all', label: 'Todas' },
  { k: 'erro', label: 'Erros' },
  { k: 'melhoria', label: 'Melhorias' },
  { k: 'pend', label: 'Não enviadas' },
]

export default function Modulo() {
  const { sis, nome: raw } = useParams()
  const nome = decodeURIComponent(raw ?? '')
  const dispatch = useAppDispatch()
  const ir = useIr()
  const mods = useAppSelector(selModulos)
  const all = useAppSelector(selComStatus)
  const ocorrencias = useAppSelector(selOcorrencias)
  const carregado = useAppSelector((s) => s.data.carregado.ocorrencias)
  const ui = useAppSelector((s) => s.ui)
  const m = mods.find((x) => x.nome === nome)

  if (carregado && !m && mods.length) return <Navigate to={`/s/${sis}/modulos`} replace />

  const fs = all.filter((x) => modOf(x.f) === nome)
  const pend = fs.filter((x) => !x.f.loteId)
  const aCnt: Record<string, number> = {}
  for (const x of fs) {
    const k = assuntoOf(x.f)
    aCnt[k] = (aCnt[k] || 0) + 1
  }
  const fAss = aCnt[ui.fAss] ? ui.fAss : 'all'
  const lista = fs
    .filter((x) => ui.fTipo === 'all' || (ui.fTipo === 'pend' ? !x.f.loteId : x.f.tipo === ui.fTipo))
    .filter((x) => fAss === 'all' || assuntoOf(x.f) === fAss)
  const grp = ui.modGroup === 'assunto'
  const stMap = new Map(fs.map((x) => [x.f.id, x.st]))
  const itens = agruparPorAssunto(
    lista.map((x) => x.f),
    grp,
    ['ocorrência', 'ocorrências'],
  )
  const nSel = ocorrencias.filter((o) => ui.selecao[o.id]).length
  const sub = fs.length
    ? plural(fs.length, 'ocorrência', 'ocorrências') + ', ' + pend.length + ' ainda não ' + (pend.length === 1 ? 'enviada' : 'enviadas') + ' ao dev'
    : 'Nenhuma ocorrência neste módulo ainda.'
  const topicos = [
    { k: 'all', nome: 'Todos', n: fs.length, cor: '' },
    ...ASSUNTOS.filter((a) => aCnt[a.key]).map((a) => ({ k: a.key, nome: a.nome, n: aCnt[a.key], cor: a.cor })),
  ]
  const btnLinha = 'font-medium text-[.9rem]'

  return (
    <>
      <header className="relative overflow-hidden bg-hero pt-7 pb-10 text-white">
        <div className="pointer-events-none absolute inset-0 hero-grid [mask-image:none]" aria-hidden />
        <div className="relative mx-auto max-w-[1168px] px-5">
          <Voltar onClick={ir.modulos}>Todos os módulos</Voltar>
          <h1 className="m-0 mb-1.5 flex flex-wrap items-center gap-3.5 font-serif text-[clamp(1.9rem,4.5vw,2.8rem)] leading-[1.15] font-bold">
            {m?.emoji && <span>{m.emoji}</span>}
            <span className="text-brand">{nome}</span>
          </h1>
          <p className="m-0 text-[1.05rem] text-hero-text">{sub}</p>
          {fs.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[.72rem] tracking-[.12em] text-cyan">ASSUNTOS DETECTADOS</span>
              {topicos.map((t) => {
                const on = fAss === t.k
                return (
                  <button
                    key={t.k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => dispatch(setFAss(t.k))}
                    className={cn(
                      'inline-flex items-center gap-[7px] rounded-full border px-3 py-[5px] text-[.86rem] font-medium transition-colors duration-200',
                      on ? 'border-white bg-white text-navy-deep' : 'border-white/18 bg-white/6 text-[#E3E4F7]',
                    )}
                  >
                    <span className="size-[9px] rounded-full" style={{ background: t.cor || (on ? '#111430' : '#fff') }} />
                    {t.nome}
                    <span className="font-mono text-[.72rem] opacity-80">{t.n}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </header>
      <Main>
        <div className="sticky top-16 z-5 flex flex-wrap items-center gap-2 border-b border-q-line bg-q-bg py-3.5">
          <Chips itens={TIPOS} valor={ui.fTipo} onChange={(k) => dispatch(setFTipo(k))} label="Filtrar por tipo" />
          <div role="group" aria-label="Organizar" className="ml-1.5 flex rounded-full bg-q-track p-[3px]">
            {(
              [
                ['assunto', 'Por assunto'],
                ['lista', 'Lista'],
              ] as const
            ).map(([k, l]) => {
              const on = ui.modGroup === k
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => dispatch(setModGroup(k))}
                  className={cn(
                    'rounded-full border-0 px-3 py-[5px] text-[.84rem] font-medium transition-colors duration-200',
                    on ? 'bg-q-card text-q-ink shadow-[0_1px_3px_rgba(17,20,48,.15)]' : 'bg-transparent text-q-muted',
                  )}
                >
                  {l}
                </button>
              )
            })}
          </div>
          <span className="flex-1" />
          <Button
            variant="linha"
            size="mini"
            className={btnLinha}
            onClick={() => dispatch(abrirModal({ kind: 'mod', moduloId: m?.id || undefined, nome }))}
          >
            Editar módulo
          </Button>
          {pend.length > 0 && (
            <Button variant="linha" size="mini" className={btnLinha} onClick={() => dispatch(selecionar(pend.map((x) => x.f.id)))}>
              Selecionar não enviadas
            </Button>
          )}
          <Button variant="primario" size="mini" className="text-[.9rem]" onClick={() => dispatch(abrirModal({ kind: 'fix', modulo: nome }))}>
            Nova ocorrência
          </Button>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {!lista.length && (
            <p className="m-0 py-10 text-center text-q-muted">
              {fs.length
                ? 'Nenhuma ocorrência neste filtro.'
                : 'Clique em “Nova ocorrência” e descreva o problema do seu jeito; a organização no padrão do dev é feita na hora.'}
            </p>
          )}
          {itens.map((x) => (
            <ItemModulo key={x.item.id} x={x} st={stMap.get(x.item.id) ?? 'aberto'} mostrarAssunto={!grp} />
          ))}
        </div>

        {nSel > 0 && (
          <div className="sticky bottom-3 z-6 mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-q-chip px-4 py-3 text-white shadow-card">
            <b>{plural(nSel, 'selecionada', 'selecionadas')}</b>
            <span className="flex-1" />
            <Button
              size="mini"
              className="rounded-md border-white/35 bg-transparent font-medium text-white hover:bg-white/10"
              onClick={() => dispatch(limparSelecao())}
            >
              Limpar seleção
            </Button>
            <Button
              size="mini"
              className="rounded-md border-white bg-q-card font-semibold text-navy-deep hover:brightness-95"
              onClick={() => dispatch(abrirModal({ kind: 'lote' }))}
            >
              Gerar lote para o dev
            </Button>
          </div>
        )}
      </Main>
    </>
  )
}

function ItemModulo({ x, st, mostrarAssunto }: { x: ItemAgrupado<Ocorrencia>; st: StatusVisivel; mostrarAssunto: boolean }) {
  const f = x.item
  const dispatch = useAppDispatch()
  const aberto = useAppSelector((s) => !!s.ui.abertas[f.id])
  const sel = useAppSelector((s) => !!s.ui.selecao[f.id])
  return (
    <>
      {x.head && <CabecalhoAssunto a={x.assunto} txt={x.grpTxt} primeiro={x.first} />}
      <FixCard
        barra={x.assunto.cor}
        aberto={aberto}
        onToggle={() => dispatch(toggleAberta(f.id))}
        marcador={
          <button
            type="button"
            onClick={() => dispatch(toggleSelecao(f.id))}
            aria-label="Selecionar para o lote"
            aria-pressed={sel}
            className={cn(
              'mt-px grid size-6 flex-none place-items-center rounded-full border-2 border-[#5B45C8] p-0 text-white',
              sel ? 'bg-q-accent' : 'bg-q-card',
            )}
          >
            {sel && <Check />}
          </button>
        }
        cabecalho={
          <>
            <CodTag>{f.cod}</CodTag>
            <TipoTag tipo={f.tipo} />
            <TituloFix>{f.titulo || 'Sem título'}</TituloFix>
            {mostrarAssunto && <TagAssunto a={x.assunto} />}
            {f.prioridade === 'alta' && <Alta />}
            {st !== 'aberto' && <Pill cor={STATUS[st]} />}
          </>
        }
      >
        <CorpoModulo f={f} st={st} />
      </FixCard>
    </>
  )
}

function CorpoModulo({ f, st }: { f: Ocorrencia; st: StatusVisivel }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const acoes = useOcorrenciaAcoes()
  const exec = useExecutar()
  const { orgId } = useSessao()
  const { armado, armar } = useArmar()
  const lotes = useAppSelector(selLotes)
  const resp = useAppSelector((s) => s.data.respostas)
  const feats = useAppSelector(selFeatures)
  const sel = useAppSelector((s) => !!s.ui.selecao[f.id])
  const r = respFix(f, lotes, resp)
  const temReg = temRegressao(f, feats)
  const a = acoesFix(st, r, temReg)
  const lote = f.loteId ? lotes.find((l) => l.id === f.loteId) : undefined
  const btn = 'font-medium text-[.85rem] px-3'

  const excluir = () =>
    armar('del' + f.id, async () => {
      if (sel) dispatch(toggleSelecao(f.id))
      await exec(excluirOcorrencia(orgId, f), 'Ocorrência excluída')
    })
  const duplicar = () => {
    const { titulo, tipo, prioridade, onde, passos, atual, erro, esperado, obs, amb, repro, massa, cenario, assunto, descricao } = f
    dispatch(
      abrirModal({
        kind: 'fix',
        modulo: modOf(f),
        preset: {
          titulo: (titulo || '') + ' (cópia)',
          tipo,
          prioridade,
          onde,
          passos,
          atual,
          erro,
          esperado,
          obs,
          prints: [],
          amb,
          repro,
          massa,
          cenario,
          assunto,
          descricao,
          modulo: modOf(f),
        },
      }),
    )
  }

  return (
    <>
      <FixBody f={f} vazioTxt="Sem detalhes ainda. Edite para completar." />
      <Conversa r={r} />
      <RespostaQA f={f} st={st} r={r} temReg={temReg} />
      {lote && (
        <p className="m-0 mt-3 text-[.92rem] text-q-muted">
          Enviado no lote <b className="font-semibold">{lote.titulo}</b>.
        </p>
      )}
      <Historico f={f} lotes={lotes} resp={resp} />
      <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-q-line pt-3">
        {a.canVal && (
          <Button size="mini" className="rounded-md bg-[#0F7A55] px-3 text-[.85rem] font-semibold text-white hover:brightness-110" onClick={() => void acoes.validar(f)}>
            Validar
          </Button>
        )}
        {a.canReg && (
          <Button variant="primario" size="mini" className="px-3 text-[.85rem]" onClick={() => void acoes.regressao(f)}>
            Criar cenário de regressão
          </Button>
        )}
        {temReg && (
          <Button
            size="mini"
            className="rounded-md border-q-ok-bg bg-q-ok-bg px-3 text-[.85rem] font-medium text-q-ok hover:border-q-ok"
            onClick={() => ir.casos('feats', modOf(f), f.regFeatId ?? undefined)}
          >
            Ver cenário de regressão
          </Button>
        )}
        {a.canReab && (
          <Button
            size="mini"
            className="rounded-md border-q-red-line bg-transparent px-3 text-[.85rem] font-medium text-q-red hover:border-q-red"
            onClick={() => void acoes.reabrir(f)}
          >
            Reabrir
          </Button>
        )}
        <Button variant="linha" size="mini" className={btn} onClick={() => dispatch(abrirModal({ kind: 'fix', fixId: f.id }))}>
          Editar
        </Button>
        <Button variant="linha" size="mini" className={btn} onClick={duplicar}>
          Duplicar
        </Button>
        <Button variant="perigo" size="mini" className={btn} onClick={excluir}>
          {armado('del' + f.id) ? 'Clique de novo para confirmar' : 'Excluir'}
        </Button>
      </div>
    </>
  )
}
