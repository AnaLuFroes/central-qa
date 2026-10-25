import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AppHeader, Main } from '@/components/AppHeader'
import { Chevron, GherkinView, TagFuncionalidade } from '@/components/GherkinView'
import { Cartao, SegBar } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { definirCaSt, excluirFeature, salvarGherkin } from '@/data/features'
import { excluirRodada } from '@/data/rodadas'
import { baixar, copiar } from '@/hooks/baixar'
import { useIr } from '@/hooks/useIr'
import { useArmar, useExecutar, useSessao, useSistema } from '@/hooks/useSessao'
import { coverBg, fmtData, hojeEyebrow, initials, palOf, plural, slug } from '@/lib/format'
import { countScen, featPath, nomeDaFeature, zipFeatures } from '@/lib/gherkin'
import { rodStats, segsRodada } from '@/lib/painel'
import { CAMADAS, CA_ST } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selFeatures, selModulos, selRodadas } from '@/store/slices/selectors'
import { setCasoMod, setCasoTab, toggleFeat, type AbaCasos } from '@/store/slices/ui'
import type { CaSt, Feature, Modulo, Rodada } from '@/types'

/** Baixa o zip com os .feature (sem os critérios de aceite). */
function baixarZip(fs: Feature[], sysN: string, nome: string) {
  const blob = zipFeatures(fs, sysN)
  if (!blob) return void toast('Nenhum caso de teste para exportar')
  baixar(nome, blob)
  toast('Arquivo ' + nome + ' baixado')
}

const isCa = (f: Feature) => f.tipo === 'ca'

export default function Casos() {
  const dispatch = useAppDispatch()
  const sistema = useSistema()
  const feats = useAppSelector(selFeatures)
  const rodadas = useAppSelector(selRodadas)
  const tab = useAppSelector((s) => s.ui.casoTab)
  const sysN = sistema?.nome ?? ''
  const caSys = feats.filter(isCa)
  const casosSys = feats.filter((f) => !isCa(f))
  const nCen = casosSys.reduce((a, f) => a + countScen(f.gherkin), 0)
  const tabCa = tab === 'ca'

  const abas: [AbaCasos, string][] = [
    ['ca', `1. Critérios de aceite (${caSys.length})`],
    ['feats', `2. Casos de teste (${casosSys.length})`],
    ['rodadas', `3. Rodadas (${rodadas.length})`],
  ]

  return (
    <>
      <AppHeader
        eyebrow={'CASOS DE TESTE · ' + hojeEyebrow()}
        titulo={sysN}
        sub="Critérios de aceite, cenários em Gherkin e rodadas de execução."
      />
      <Main className="pb-16">
        <Cartao className="-mt-[60px] flex flex-wrap items-center gap-x-9 gap-y-5 px-[26px] py-[22px]">
          <p className="m-0 max-w-[70ch] flex-[1_1_340px] text-[1.02rem] text-pretty">
            Primeiro os critérios de aceite, revisados e aprovados com o PO. Depois os casos de teste, gerados a partir deles e
            prontos para o Cypress. Por fim, as rodadas.
          </p>
          <div className="flex gap-8">
            <Stat valor={caSys.filter((f) => f.caSt === 'aprovado').length} de={caSys.length} label="critérios aprovados" ok />
            <Stat valor={casosSys.length} label="funcionalidades de teste" />
            <Stat valor={nCen} label="cenários" />
          </div>
          <Button variant="primario" size="acao" className="text-base" onClick={() => dispatch(abrirModal({ kind: 'caso', mode: tabCa ? 'ca' : 'casos' }))}>
            {tabCa ? 'Escrever critérios de aceite' : 'Gerar casos de teste'}
          </Button>
          <Button variant="linha" size="acao" className="text-base font-medium" onClick={() => baixarZip(feats, sysN, 'cypress-' + slug(sysN) + '.zip')}>
            Baixar tudo (.zip)
          </Button>
        </Cartao>

        <div className="mt-7 flex flex-wrap gap-1.5" role="tablist">
          {abas.map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => dispatch(setCasoTab(k))}
              className={cn(
                'rounded-full border px-[18px] py-[7px] text-[.95rem] font-medium transition-colors',
                tab === k ? 'border-q-chip bg-q-chip text-white' : 'border-q-line bg-q-card text-q-muted hover:border-q-accent hover:text-q-accent',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === 'rodadas' ? <AbaRodadas rodadas={rodadas} /> : <AbaFeatures key={tab} tabCa={tabCa} feats={feats} sysN={sysN} />}
      </Main>
    </>
  )
}

function Stat({ valor, de, label, ok }: { valor: number; de?: number; label: string; ok?: boolean }) {
  return (
    <div>
      <div className={cn('font-serif text-[2rem] leading-none font-bold', ok ? 'text-q-ok' : 'text-q-accent')}>
        {valor}
        {de != null && <small className="text-base font-semibold text-q-muted"> / {de}</small>}
      </div>
      <div className="mt-1.5 text-[.95rem] text-q-muted">{label}</div>
    </div>
  )
}

/* ---------- critérios de aceite e casos de teste ---------- */

function AbaFeatures({ tabCa, feats, sysN }: { tabCa: boolean; feats: Feature[]; sysN: string }) {
  const dispatch = useAppDispatch()
  const mods = useAppSelector(selModulos)
  const casoMod = useAppSelector((s) => s.ui.casoMod)
  const featsOf = (n: string) => feats.filter((f) => f.modulo === n && isCa(f) === tabCa)

  if (!mods.length)
    return (
      <p className="m-0 pt-10 text-center text-q-muted">
        Este sistema ainda não tem módulos.
        <br />
        Gere casos de teste informando um módulo novo, ou crie o módulo na aba Módulos.
      </p>
    )

  const cmName =
    casoMod && mods.some((m) => m.nome === casoMod) ? casoMod : (mods.find((m) => featsOf(m.nome).length) ?? mods[0]).nome
  const lista = featsOf(cmName)
  const novo = () => dispatch(abrirModal({ kind: 'caso', mode: tabCa ? 'ca' : 'casos', modulo: cmName }))

  return (
    <div className="mt-8 flex flex-wrap items-start gap-6">
      <nav
        aria-label="Módulos"
        className="sticky top-[84px] flex max-w-[300px] flex-[1_1_220px] flex-col gap-0.5 rounded-2xl border border-q-line bg-q-card p-2.5"
      >
        <p className="mx-2.5 mt-1.5 mb-2 font-mono text-[.74rem] tracking-[.1em] text-q-muted">MÓDULOS</p>
        {mods.map((m) => (
          <ItemModulo key={m.nome} m={m} fs={featsOf(m.nome)} tabCa={tabCa} ativo={m.nome === cmName} onPick={() => dispatch(setCasoMod(m.nome))} />
        ))}
      </nav>
      <div className="min-w-0 flex-[999_1_420px]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#5B45C8] pb-3">
          <div className="min-w-0">
            <h2 className="m-0 font-serif text-[1.5rem] leading-tight">{cmName}</h2>
            <p className="m-0 mt-1 font-mono text-[.8rem] break-all text-q-muted">
              {tabCa
                ? 'Critérios de aceite · revisão com o PO antes do desenvolvimento'
                : 'cypress/e2e/<camada>/' + slug(sysN) + '/' + slug(cmName) + '/'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!tabCa && (
              <Button variant="linha" size="mini" className="font-medium" onClick={() => baixarZip(lista, sysN, slug(sysN) + '-' + (slug(cmName) || 'modulo') + '.zip')}>
                Baixar módulo (.zip)
              </Button>
            )}
            <Button variant="linha" size="mini" className="font-medium" onClick={novo}>
              {tabCa ? 'Escrever critérios' : 'Nova funcionalidade'}
            </Button>
          </div>
        </div>
        {!lista.length && (
          <p className="mx-auto my-0 max-w-[60ch] px-5 py-10 text-center text-q-muted">
            {tabCa
              ? 'Nenhum critério de aceite neste módulo ainda. Clique em “Escrever critérios”, cole o escopo e revise com o PO.'
              : 'Nenhum caso de teste neste módulo ainda. Aprove os critérios de aceite e gere os casos a partir deles.'}
          </p>
        )}
        <div className="mt-[18px] flex flex-col gap-3.5">
          {lista.map((f) => (
            <CartaoFeature key={f.id} f={f} feats={feats} sysN={sysN} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemModulo({ m, fs, tabCa, ativo, onPick }: { m: Modulo; fs: Feature[]; tabCa: boolean; ativo: boolean; onPick: () => void }) {
  const nc = fs.reduce((a, f) => a + countScen(f.gherkin), 0)
  const meta = fs.length
    ? plural(fs.length, 'funcionalidade', 'funcionalidades') + ' · ' + (tabCa ? plural(nc, 'critério', 'critérios') : plural(nc, 'cenário', 'cenários'))
    : tabCa
      ? 'Sem critérios'
      : 'Sem casos'
  return (
    <button
      onClick={onPick}
      aria-current={ativo || undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
        ativo ? 'bg-q-soft' : 'hover:bg-q-bg',
      )}
    >
      <span
        className="grid size-9 flex-none place-items-center rounded-[10px] font-serif text-[1.05rem] font-bold text-white"
        style={{ background: coverBg(palOf(m)) }}
        aria-hidden
      >
        {m.emoji || initials(m.nome)}
      </span>
      <span className="flex min-w-0 flex-col leading-[1.35]">
        <span className={cn('text-[.98rem] font-semibold', ativo && 'text-q-accent')}>{m.nome}</span>
        <span className="text-[.82rem] text-q-muted">{meta}</span>
      </span>
    </button>
  )
}

const TOAST_CA: Record<CaSt, string> = {
  revisao: 'Enviado para revisão com o PO',
  aprovado: 'Critérios aprovados',
  rascunho: 'Voltou para rascunho',
}

function metaFeature(f: Feature, feats: Feature[], sysN: string) {
  if (!isCa(f)) return featPath(f, sysN)
  if (f.caSt === 'aprovado') {
    const deriv = feats.filter((x) => !isCa(x) && x.caId === f.id).length
    return (
      'Aprovado em ' +
      fmtData(f.aprovEm || f.criadoEm) +
      ' · ' +
      plural(deriv, 'funcionalidade de teste derivada', 'funcionalidades de teste derivadas')
    )
  }
  const nDuv = f.gherkin.split('\n').filter((l) => /^\s*#\s*-/.test(l)).length
  return nDuv ? plural(nDuv, 'dúvida para o PO', 'dúvidas para o PO') : 'Sem dúvidas registradas'
}

function CartaoFeature({ f, feats, sysN }: { f: Feature; feats: Feature[]; sysN: string }) {
  const dispatch = useAppDispatch()
  const aberto = useAppSelector((s) => !!s.ui.openFeat[f.id])
  const { orgId } = useSessao()
  const executar = useExecutar()
  const { armado, armar } = useArmar()
  const [draft, setDraft] = useState<string | null>(null)
  const ca = isCa(f)
  const cst = CA_ST[f.caSt || 'rascunho']
  const orig = f.caId ? feats.find((x) => x.id === f.caId) : undefined
  const n = countScen(f.gherkin)
  const camada = (CAMADAS.find((c) => c[0] === (f.camada || 'e2e')) ?? ['', 'E2E'])[1]

  const setCa = (st: CaSt) => executar(definirCaSt(orgId, f.id, st), TOAST_CA[st])
  const copy = async () => toast((await copiar(f.gherkin)) ? 'Gherkin copiado' : 'Não foi possível copiar')
  const dl = () => {
    const nome = slug(f.nome) + '.feature'
    baixar(nome, f.gherkin)
    toast('Arquivo ' + nome + ' baixado')
  }
  const salvar = async () => {
    if (draft == null) return
    const ok = await executar(salvarGherkin(orgId, f.id, draft, nomeDaFeature(draft) || f.nome).then(() => true), 'Funcionalidade salva')
    if (ok) setDraft(null)
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-q-line bg-q-card">
      <button
        onClick={() => dispatch(toggleFeat(f.id))}
        aria-expanded={aberto}
        className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left"
      >
        <Chevron aberto={aberto} />
        <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-[3px]">
          <span className="flex flex-wrap items-baseline gap-2.5">
            <TagFuncionalidade />
            <span className="text-[1.05rem] leading-[1.35] font-semibold">{f.nome}</span>
            {ca ? (
              <span className="rounded-full px-2.5 py-0.5 text-[.78rem] font-semibold" style={{ color: cst[1], background: cst[2] }}>
                {cst[0]}
              </span>
            ) : (
              <span className="rounded-full bg-q-info-bg px-2.5 py-0.5 text-[.78rem] font-semibold text-q-navy">{camada}</span>
            )}
          </span>
          <span className="font-mono text-[.76rem] break-all text-q-muted">{metaFeature(f, feats, sysN)}</span>
          {orig && <span className="text-[.84rem] text-q-ok">Derivado dos critérios “{orig.nome}”</span>}
        </span>
        <span className="flex-none rounded-full bg-q-soft px-[11px] py-0.5 text-[.82rem] font-semibold text-q-accent">
          {ca ? plural(n, 'critério', 'critérios') : plural(n, 'cenário', 'cenários')}
        </span>
        <span className="flex-none rounded-[5px] border border-q-line px-1.5 py-px font-mono text-[.72rem] font-semibold text-q-muted">
          {f.lang === 'en' ? 'EN' : 'PT'}
        </span>
      </button>
      {aberto && (
        <>
          <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
            <span className="mr-auto text-[.85rem] text-q-muted">{(ca ? 'Escrito em ' : 'Gerado em ') + fmtData(f.criadoEm)}</span>
            {draft == null ? (
              <>
                <Acao onClick={copy}>Copiar</Acao>
                {ca && (f.caSt || 'rascunho') === 'rascunho' && (
                  <Acao primario onClick={() => setCa('revisao')}>
                    Enviar para revisão do PO
                  </Acao>
                )}
                {ca && f.caSt === 'revisao' && (
                  <button
                    onClick={() => setCa('aprovado')}
                    className="rounded-md border border-[#0F7A55] bg-[#0F7A55] px-3 py-1.5 text-[.85rem] font-semibold text-white hover:brightness-110"
                  >
                    Aprovar critérios
                  </button>
                )}
                {ca && f.caSt === 'revisao' && <Acao onClick={() => setCa('rascunho')}>Voltar para rascunho</Acao>}
                {ca && f.caSt === 'aprovado' && (
                  <Acao primario onClick={() => dispatch(abrirModal({ kind: 'caso', mode: 'casos', modulo: f.modulo, caId: f.id }))}>
                    Gerar casos de teste
                  </Acao>
                )}
                {!ca && <Acao onClick={dl}>Baixar .feature</Acao>}
                <Acao onClick={() => setDraft(f.gherkin)}>Editar</Acao>
                <Acao perigo onClick={() => armar('df' + f.id, () => void executar(excluirFeature(orgId, f.id), 'Funcionalidade excluída'))}>
                  {armado('df' + f.id) ? 'Clique de novo para confirmar' : 'Excluir'}
                </Acao>
              </>
            ) : (
              <>
                <Acao onClick={() => setDraft(null)}>Cancelar</Acao>
                <Acao primario onClick={salvar}>
                  Salvar
                </Acao>
              </>
            )}
          </div>
          {draft == null ? (
            <GherkinView texto={f.gherkin} className="mx-[18px] mb-[18px]" />
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              rows={18}
              aria-label="Gherkin"
              className="mx-[18px] mb-[18px] block w-[calc(100%-36px)] resize-y rounded-xl border border-q-chip bg-[#111430] px-4 py-3.5 font-mono text-[.84rem] leading-[1.7] text-[#E3E4F7] outline-none focus:border-cyan"
            />
          )}
        </>
      )}
    </article>
  )
}

function Acao({ children, onClick, primario, perigo }: { children: ReactNode; onClick: () => void; primario?: boolean; perigo?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border py-1.5 text-[.85rem] transition-colors',
        primario
          ? 'border-transparent bg-brand px-3.5 font-semibold text-navy-deep hover:brightness-105'
          : 'border-q-line bg-transparent px-3 font-medium text-q-muted',
        !primario && (perigo ? 'hover:border-q-red hover:text-q-red' : 'hover:border-q-accent hover:text-q-accent'),
      )}
    >
      {children}
    </button>
  )
}

/* ---------- rodadas ---------- */

function AbaRodadas({ rodadas }: { rodadas: Rodada[] }) {
  const dispatch = useAppDispatch()
  return (
    <>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#5B45C8] pb-3">
        <div>
          <h2 className="m-0 font-serif text-[1.5rem] leading-tight">Rodadas de teste</h2>
          <p className="m-0 mt-1 text-[.92rem] text-q-muted">
            Cada rodada fica amarrada à branch ou ao commit testado. Marque cada cenário como Passou, Falhou ou Bloqueado.
          </p>
        </div>
        <Button variant="primario" size="mini" className="px-4 py-[7px] text-[.9rem]" onClick={() => dispatch(abrirModal({ kind: 'rodada' }))}>
          Nova rodada
        </Button>
      </div>
      {!rodadas.length && (
        <p className="m-0 py-10 text-center text-q-muted">
          Nenhuma rodada ainda.
          <br />
          Clique em “Nova rodada” e escolha as funcionalidades que vão ser testadas.
        </p>
      )}
      <div className="mt-[18px] flex flex-col gap-3">
        {rodadas.map((r) => (
          <CartaoRodada key={r.id} r={r} />
        ))}
      </div>
    </>
  )
}

function CartaoRodada({ r }: { r: Rodada }) {
  const ir = useIr()
  const { orgId } = useSessao()
  const executar = useExecutar()
  const { armado, armar } = useArmar()
  const st = rodStats(r)
  return (
    <div className="rounded-xl border border-q-line bg-q-card px-[22px] py-[18px]">
      <h3 className="m-0 mb-0.5 font-serif text-[1.2rem]">{r.nome}</h3>
      <p className="m-0 text-[.9rem] text-q-muted">{fmtData(r.criadoEm) + ' · ' + plural(st.t, 'cenário', 'cenários')}</p>
      <SegBar segs={segsRodada(st)} alto={8} className="mt-3" />
      <p className="m-0 mt-2 text-[.86rem] text-q-muted">{st.counts}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => ir.rodada(r.id)}
          className="rounded-md bg-brand px-4 py-1.5 text-[.88rem] font-semibold text-navy-deep hover:brightness-105"
        >
          Abrir
        </button>
        <button
          onClick={() => armar('dr' + r.id, () => void executar(excluirRodada(orgId, r.id), 'Rodada excluída'))}
          className="rounded-md border border-q-line px-3.5 py-1.5 text-[.88rem] font-medium text-q-muted transition-colors hover:border-q-red hover:text-q-red"
        >
          {armado('dr' + r.id) ? 'Clique de novo para confirmar' : 'Excluir'}
        </button>
      </div>
    </div>
  )
}
