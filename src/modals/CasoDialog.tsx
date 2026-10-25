import { useState } from 'react'
import { toast } from 'sonner'
import { Campo, Modal, StatusModal } from '@/components/Modal'
import { inputCls } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { criarFeature } from '@/data/features'
import { garantirModulo } from '@/data/modulos'
import { useIr } from '@/hooks/useIr'
import { useSessao, useSistema } from '@/hooks/useSessao'
import { plural } from '@/lib/format'
import { TIPOS, countScen, genLocal, genLocalCA, nomeDaFeature, semCercas, stepDict, type EntradaGherkin, type TipoCobertura } from '@/lib/gherkin'
import { completar, erroIA, iaConfigurada } from '@/lib/ia'
import { buildPrompt, buildPromptCA } from '@/lib/ia/prompts'
import { CAMADAS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import type { Modal as TModal } from '@/store/slices/modal'
import { selFeatures, selModulos } from '@/store/slices/selectors'
import type { Camada, Feature } from '@/types'

type Props = { m: Extract<TModal, { kind: 'caso' }>; onClose: () => void }

interface Form {
  caId: string
  modulo: string
  nome: string
  escopo: string
  camada: Camada
  tipos: Record<TipoCobertura, boolean>
  lang: 'pt' | 'en'
  tags: string
}

const selectCls = cn(inputCls, 'cursor-pointer')

/** Tag do critério (@CA-NN) a partir do Gherkin ou do código gravado. */
const tagDoCa = (ca: Feature | undefined) => (ca ? (ca.gherkin.match(/@CA-\d+/)?.[0] ?? (ca.caCod ? '@' + ca.caCod : '')) : '')

export default function CasoDialog({ m, onClose }: Props) {
  const isCa = m.mode === 'ca'
  const feats = useAppSelector(selFeatures)
  const mods = useAppSelector(selModulos)
  const modulosAll = useAppSelector((s) => s.data.modulos)
  const ia = useAppSelector((s) => s.data.ia)
  const sistema = useSistema()
  const { orgId } = useSessao()
  const ir = useIr()
  const sysN = sistema?.nome ?? ''
  const casosSys = feats.filter((f) => f.tipo !== 'ca')
  const aprov = feats.filter((f) => f.tipo === 'ca' && f.caSt === 'aprovado')
  const dict = stepDict(casosSys)

  const [v, setV] = useState<Form>(() => {
    const ca = !isCa && m.caId ? feats.find((x) => x.id === m.caId) : undefined
    return {
      caId: ca?.id ?? '',
      modulo: ca?.modulo ?? m.modulo ?? '',
      nome: ca?.nome ?? '',
      escopo: ca?.gherkin ?? '',
      camada: 'e2e',
      tipos: { feliz: true, neg: true, lim: !isCa, perm: false },
      lang: 'pt',
      tags: '',
    }
  })
  const [result, setResult] = useState('')
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [status, setStatus] = useState<{ txt: string; bad: boolean }>({ txt: '', bad: false })
  const set = (p: Partial<Form>) => setV((x) => ({ ...x, ...p }))

  const escolherCa = (id: string) => {
    const ca = aprov.find((x) => x.id === id)
    set(ca ? { caId: id, modulo: ca.modulo, nome: ca.nome, escopo: ca.gherkin } : { caId: '' })
  }

  const gerar = async () => {
    if (gerando) return
    if (!v.escopo.trim()) return setStatus({ txt: 'Descreva o escopo primeiro.', bad: true })
    setGerando(true)
    setStatus({ txt: '', bad: false })
    const ca = v.caId ? feats.find((x) => x.id === v.caId) : undefined
    const vv: EntradaGherkin = { ...v, caTxt: !!ca, caTag: tagDoCa(ca) }
    let out = ''
    let motivo = ''
    if (iaConfigurada(ia)) {
      try {
        out = semCercas(await completar(ia, isCa ? buildPromptCA(vv, sysN) : buildPrompt(vv, sysN, dict)))
      } catch (e) {
        motivo = erroIA(e)
      }
    }
    const comIa = !!out
    if (!out) out = isCa ? genLocalCA(vv, sysN) : genLocal(vv, sysN)
    setResult(out)
    setGerando(false)
    setStatus({
      txt: (comIa ? 'Pronto. ' : 'Rascunho local, sem IA: revise com atenção. ') + 'Revise e salve.' + (motivo ? ' (' + motivo + ')' : ''),
      bad: false,
    })
  }

  const salvar = async () => {
    if (salvando || !sistema) return
    const g = result.trim()
    if (!g) return setStatus({ txt: 'Gere os casos antes de salvar.', bad: true })
    const modulo = v.modulo.trim() || 'Geral'
    const nome = v.nome.trim() || nomeDaFeature(g) || modulo
    setSalvando(true)
    try {
      const id = await criarFeature(orgId, {
        tipo: isCa ? 'ca' : 'casos',
        sis: sistema.id,
        modulo,
        nome,
        lang: v.lang,
        gherkin: g,
        caSt: 'rascunho',
        caCod: '',
        caId: isCa ? null : v.caId || null,
        camada: isCa ? 'e2e' : v.camada,
      })
      await garantirModulo(orgId, sistema.id, modulo, modulosAll)
      toast(isCa ? 'Critérios salvos como rascunho' : 'Casos de teste salvos')
      ir.casos(isCa ? 'ca' : 'feats', modulo, id)
    } catch (e) {
      setStatus({ txt: 'Não foi possível salvar. ' + ((e as Error)?.message ?? ''), bad: true })
      setSalvando(false)
    }
  }

  const aiInfo = isCa
    ? 'Gera um cenário por regra, sem cliques nem telas, e um bloco “Dúvidas para o PO” quando algo estiver ambíguo.'
    : dict.length
      ? 'Reaproveita ' + plural(dict.length, 'passo já usado', 'passos já usados') + ' neste sistema e marca com “# NOVO PASSO” o que precisar ser criado no Cypress.'
      : 'Gera Contexto, cenários e Esquema do Cenário com Exemplos. As tags do sistema, do módulo, da camada e do critério entram automaticamente.'
  const nRes = countScen(result)

  return (
    <Modal
      onClose={onClose}
      largura={760}
      titulo={isCa ? 'Escrever critérios de aceite' : 'Gerar casos de teste'}
      descricao={
        isCa
          ? 'Cole o escopo. O Claude escreve os critérios em Gherkin declarativo, só com regras de negócio, e lista as dúvidas para levar ao PO.'
          : 'Os casos partem dos critérios de aceite aprovados. Escolha a camada: API e E2E vão para o Cypress; Manual fica para as rodadas.'
      }
      rodape={
        <>
          <StatusModal erro={status.bad}>{status.txt}</StatusModal>
          <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primario" size="modal" onClick={salvar} disabled={salvando}>
            {isCa ? 'Salvar como rascunho' : 'Salvar no módulo'}
          </Button>
        </>
      }
    >
      {!isCa && (
        <Campo
          label="Critérios de aceite aprovados"
          dica={
            !aprov.length && (
              <span className="text-q-warn">
                Nenhum critério aprovado ainda. Você pode gerar a partir do escopo, mas o ideal é aprovar os critérios com o PO antes.
              </span>
            )
          }
        >
          <select className={selectCls} value={v.caId} onChange={(e) => escolherCa(e.target.value)}>
            <option value="">Sem critério vinculado</option>
            {aprov.map((f) => (
              <option key={f.id} value={f.id}>
                {f.modulo + ' › ' + f.nome}
              </option>
            ))}
          </select>
        </Campo>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <Campo label="Módulo">
          <input className={inputCls} list="caso-mods" value={v.modulo} onChange={(e) => set({ modulo: e.target.value })} placeholder="Ex.: Telas de Login" />
          <datalist id="caso-mods">
            {mods.map((x) => (
              <option key={x.nome} value={x.nome} />
            ))}
          </datalist>
        </Campo>
        <Campo label="Funcionalidade">
          <input className={inputCls} value={v.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Login com e-mail e senha" />
        </Campo>
      </div>
      <Campo label={isCa ? 'Escopo' : 'Critérios de aceite (base)'}>
        <textarea
          rows={7}
          className={cn(inputCls, 'resize-y leading-normal')}
          value={v.escopo}
          onChange={(e) => set({ escopo: e.target.value })}
          placeholder="Ex.: O usuário entra com e-mail e senha. O e-mail não diferencia maiúsculas de minúsculas. Após 5 tentativas erradas, a conta fica bloqueada por 15 minutos. Campos obrigatórios mostram mensagem quando vazios."
        />
      </Campo>
      {!isCa && (
        <>
          <Campo label="Cobertura">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map(([k, l]) => {
                const on = v.tipos[k]
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ tipos: { ...v.tipos, [k]: !on } })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[.88rem] font-medium transition-colors',
                      on ? 'border-q-chip bg-q-chip text-white' : 'border-q-line bg-q-card text-q-muted hover:border-q-accent hover:text-q-accent',
                    )}
                  >
                    {on && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 8.5l3.2 3L13 4.5" />
                      </svg>
                    )}
                    {l}
                  </button>
                )
              })}
            </div>
          </Campo>
          <Campo label="Camada">
            <select className={selectCls} value={v.camada} onChange={(e) => set({ camada: e.target.value as Camada })}>
              {CAMADAS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Campo>
        </>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <Campo label="Idioma do Gherkin">
          <select className={selectCls} value={v.lang} onChange={(e) => set({ lang: e.target.value === 'en' ? 'en' : 'pt' })}>
            <option value="pt">Português (Dado, Quando, Então)</option>
            <option value="en">Inglês (Given, When, Then)</option>
          </select>
        </Campo>
        {!isCa && (
          <Campo label="Tags extras (opcional)">
            <input className={cn(inputCls, 'font-mono text-[.88rem]')} value={v.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="@smoke @regressao" />
          </Campo>
        )}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] bg-q-soft px-3.5 py-3">
        <p className="m-0 flex-[1_1_260px] text-[.9rem]">{aiInfo}</p>
        <Button variant="primario" size="mini" className="text-[.85rem]" onClick={gerar} disabled={gerando}>
          {gerando ? 'Gerando…' : result ? 'Gerar de novo' : isCa ? 'Gerar critérios' : 'Gerar casos'}
        </Button>
      </div>
      {result && (
        <>
          <div className="mt-2 mb-2.5 flex items-center gap-2.5 text-[.9rem] font-semibold text-q-accent">
            Resultado
            <span className="font-medium text-q-muted">{isCa ? plural(nRes, 'critério', 'critérios') : plural(nRes, 'cenário', 'cenários')}</span>
            <span className="h-px flex-1 bg-q-line" />
          </div>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            spellCheck={false}
            rows={16}
            aria-label="Resultado"
            className="mb-3 block w-full resize-y rounded-xl border border-q-chip bg-[#111430] px-4 py-3.5 font-mono text-[.84rem] leading-[1.7] text-[#E3E4F7] outline-none focus:border-cyan"
          />
        </>
      )}
    </Modal>
  )
}
