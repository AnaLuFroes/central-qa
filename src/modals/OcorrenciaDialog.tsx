import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Campo, Modal, StatusModal } from '@/components/Modal'
import { inputCls } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { garantirModulo } from '@/data/modulos'
import { criarOcorrencia, novoIdOcorrencia, salvarOcorrencia, type DadosOcorrencia } from '@/data/ocorrencias'
import { enviarPrint, removerPrints } from '@/data/prints'
import { ligarFalha } from '@/data/rodadas'
import { useIr } from '@/hooks/useIr'
import { useSessao, useSistema } from '@/hooks/useSessao'
import { ASSUNTOS, A_MAP, assuntoOf } from '@/lib/assuntos'
import { lines } from '@/lib/format'
import { organizar } from '@/lib/organizar'
import { REPRO } from '@/lib/status'
import { cn } from '@/lib/utils'
import { PrintDrop } from '@/modals/PrintDrop'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setDraftOcorrencia, type FormOcorrencia } from '@/store/slices/drafts'
import type { Modal as TModal, PresetFix } from '@/store/slices/modal'
import { selModulos } from '@/store/slices/selectors'
import { setLastAmb } from '@/store/slices/ui'
import type { CenarioRef, Ocorrencia, Prioridade, Repro, Tipo } from '@/types'

type M = Extract<TModal, { kind: 'fix' }>

const MAX_PRINTS = 8
const selectCls = cn(
  inputCls,
  'cursor-pointer appearance-none pr-[34px] bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2016%2016%27%3E%3Cpath%20d=%27M4%206l4%204%204-4%27%20fill=%27none%27%20stroke=%27%235B45C8%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat',
)
const areaCls = cn(inputCls, 'resize-y leading-normal')

const vazio = (orgId: string, modulo: string, amb: string): FormOcorrencia => ({
  docId: novoIdOcorrencia(orgId),
  editando: false,
  titulo: '',
  modulo,
  tipo: 'erro',
  prioridade: 'normal',
  assunto: '',
  descricao: '',
  amb,
  repro: 'sempre',
  massa: '',
  onde: '',
  passosT: '',
  atual: '',
  erro: '',
  espT: '',
  obs: '',
  prints: [],
  struct: false,
})

/** Preenche o formulário com uma ocorrência existente (edição) ou com um preset (duplicar, falha na rodada). */
function deDados(base: FormOcorrencia, d: PresetFix | Ocorrencia): FormOcorrencia {
  const passos = d.passos ?? []
  return {
    ...base,
    titulo: d.titulo ?? '',
    modulo: d.modulo ?? base.modulo,
    tipo: d.tipo ?? 'erro',
    prioridade: d.prioridade ?? 'normal',
    assunto: d.assunto ?? '',
    descricao: d.descricao ?? '',
    amb: d.amb ?? base.amb,
    repro: d.repro || 'sempre',
    massa: d.massa ?? '',
    onde: d.onde ?? '',
    passosT: passos.join('\n'),
    atual: d.atual ?? '',
    erro: d.erro ?? '',
    espT: (d.esperado ?? []).join('\n'),
    obs: d.obs ?? '',
    prints: d.prints ?? [],
    struct: !!(d.onde || d.atual || passos.length),
  }
}

export default function OcorrenciaDialog({ m, onClose }: { m: M; onClose: () => void }) {
  const fix = useAppSelector((s) => (m.fixId ? s.data.ocorrencias.find((o) => o.id === m.fixId) : undefined))
  useEffect(() => {
    if (m.fixId && !fix) onClose()
  }, [m.fixId, fix, onClose])
  if (m.fixId && !fix) return null
  return <Formulario m={m} fix={fix} onClose={onClose} />
}

function Formulario({ m, fix, onClose }: { m: M; fix: Ocorrencia | undefined; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const { orgId, uid } = useSessao()
  const sistema = useSistema()
  const mods = useAppSelector(selModulos)
  const todosMods = useAppSelector((s) => s.data.modulos)
  const ia = useAppSelector((s) => s.data.ia)
  const lastAmb = useAppSelector((s) => s.ui.lastAmb)
  const draft = useAppSelector((s) => s.drafts.ocorrencia)
  // Só a ocorrência nova "em branco" vira rascunho; edição e presets não.
  const usaDraft = !fix && !m.preset && !m.origin

  const [f, setF] = useState<FormOcorrencia>(() => {
    const base = vazio(orgId, m.modulo ?? '', lastAmb)
    if (fix) return { ...deDados(base, fix), docId: fix.id, editando: true }
    if (m.preset) return deDados(base, m.preset)
    if (draft) return { ...draft, modulo: draft.modulo || m.modulo || '' }
    return base
  })
  const [cenario] = useState<CenarioRef | null>(fix?.cenario ?? m.preset?.cenario ?? null)
  const [status, setStatus] = useState<{ t: string; bad: boolean }>({ t: '', bad: false })
  const [organizando, setOrganizando] = useState(false)
  const [organizado, setOrganizado] = useState(false)
  const [enviando, setEnviando] = useState(0)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (usaDraft) dispatch(setDraftOcorrencia(f))
  }, [f, usaDraft, dispatch])

  const set = (p: Partial<FormOcorrencia>) => setF((x) => ({ ...x, ...p }))
  const aDet = A_MAP[assuntoOf({ titulo: f.titulo, descricao: f.descricao, onde: f.onde, atual: f.atual, erro: f.erro, passos: [f.passosT], esperado: [f.espT] })].nome

  const subir = async (files: File[]) => {
    const livres = MAX_PRINTS - f.prints.length - enviando
    const imgs = files.filter((x) => x.type.startsWith('image/')).slice(0, Math.max(0, livres))
    if (files.length && !imgs.length && livres <= 0) return void toast('No máximo ' + MAX_PRINTS + ' prints por ocorrência')
    setEnviando((n) => n + imgs.length)
    for (const file of imgs) {
      try {
        const p = await enviarPrint(orgId, f.docId, file, uid)
        setF((x) => ({ ...x, prints: [...x.prints, p] }))
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setEnviando((n) => n - 1)
      }
    }
  }

  const doOrganizar = async () => {
    if (!f.titulo.trim() && !f.descricao.trim()) return setStatus({ t: 'Escreva um título ou uma descrição primeiro.', bad: true })
    setOrganizando(true)
    setStatus({ t: '', bad: false })
    try {
      const { status: st, ...r } = await organizar({ ...f, sistema: sistema?.nome ?? '', nPrints: f.prints.length }, ia)
      set({ ...r, struct: true })
      setOrganizado(true)
      setStatus({ t: st, bad: false })
    } finally {
      setOrganizando(false)
    }
  }

  const salvar = async () => {
    const titulo = f.titulo.trim()
    if (!titulo) return setStatus({ t: 'Dê um título à ocorrência.', bad: true })
    if (enviando) return setStatus({ t: 'Aguarde o envio dos prints.', bad: true })
    const sis = sistema?.id ?? ''
    const modulo = f.modulo.trim() || 'Geral'
    const amb = f.amb.trim()
    const dados: DadosOcorrencia = {
      titulo,
      tipo: f.tipo,
      prioridade: f.prioridade,
      onde: f.onde.trim(),
      passos: lines(f.passosT),
      atual: f.atual.trim(),
      erro: f.erro.trim(),
      esperado: lines(f.espT),
      obs: f.obs.trim(),
      prints: f.prints,
      modulo,
      descricao: f.descricao.trim(),
      amb,
      repro: f.repro,
      massa: f.massa.trim(),
      assunto: f.assunto,
      cenario,
    }
    setSalvando(true)
    try {
      if (fix) {
        await salvarOcorrencia(orgId, fix.id, dados)
        // Prints removidos na edição: apaga os arquivos, a menos que algum lote ainda os mostre.
        if (!fix.loteId && !fix.hist.length) await removerPrints(orgId, fix.prints.filter((p) => !f.prints.some((x) => x.id === p.id)))
      } else await criarOcorrencia(orgId, sis, f.docId, dados, uid)
      await garantirModulo(orgId, sis, modulo, todosMods)
      if (m.origin) await ligarFalha(orgId, m.origin.rid, m.origin.key, f.docId)
    } catch (e) {
      setSalvando(false)
      return setStatus({ t: 'Não foi possível salvar. ' + ((e as Error)?.message ?? ''), bad: true })
    }
    if (usaDraft) dispatch(setDraftOcorrencia(null))
    if (amb) dispatch(setLastAmb(amb))
    toast('Ocorrência salva')
    if (m.origin) onClose()
    else ir.fix({ id: f.docId, modulo })
  }

  const temRascunho = usaDraft && !!draft && !!(draft.titulo || draft.descricao || draft.prints.length)
  const descartar = async () => {
    await removerPrints(orgId, f.prints)
    setF(vazio(orgId, m.modulo ?? '', lastAmb))
    setOrganizado(false)
    setStatus({ t: 'Rascunho descartado.', bad: false })
  }

  return (
    <Modal
      onClose={onClose}
      titulo={fix ? 'Editar ocorrência' : 'Nova ocorrência'}
      descricao="Escreva do seu jeito. Depois clique em “Organizar” para transformar no padrão de correção; você revisa antes de salvar."
      rodape={
        <>
          <StatusModal erro={status.bad}>{status.t}</StatusModal>
          {temRascunho && (
            <Button variant="perigo" size="modal" className="font-medium" onClick={() => void descartar()}>
              Descartar rascunho
            </Button>
          )}
          <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primario" size="modal" disabled={salvando} onClick={() => void salvar()}>
            Salvar
          </Button>
        </>
      }
    >
      <Campo label="Título">
        <input
          value={f.titulo}
          onChange={(e) => set({ titulo: e.target.value })}
          placeholder="Ex.: botão de aprovar duplicado no card"
          className={inputCls}
          autoFocus
        />
      </Campo>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-3">
        <Campo label="Tela ou módulo">
          <input
            list="oc-mods"
            value={f.modulo}
            onChange={(e) => set({ modulo: e.target.value })}
            placeholder="Ex.: Tela inicial"
            className={inputCls}
          />
          <datalist id="oc-mods">
            {mods.map((x) => (
              <option key={x.nome} value={x.nome} />
            ))}
          </datalist>
        </Campo>
        <Campo label="Tipo">
          <select value={f.tipo} onChange={(e) => set({ tipo: e.target.value as Tipo })} className={selectCls}>
            <option value="erro">Erro</option>
            <option value="melhoria">Melhoria</option>
          </select>
        </Campo>
        <Campo label="Prioridade">
          <select value={f.prioridade} onChange={(e) => set({ prioridade: e.target.value as Prioridade })} className={selectCls}>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="baixa">Baixa</option>
          </select>
        </Campo>
        <Campo label="Assunto">
          <select value={f.assunto} onChange={(e) => set({ assunto: e.target.value })} className={selectCls}>
            <option value="">Automático · {aDet}</option>
            {ASSUNTOS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      {cenario && (
        <p className="m-0 mb-3 rounded-lg bg-q-ok-bg px-3 py-2 text-[.88rem] text-q-ok">
          Vinculada ao cenário: {(cenario.ca ? cenario.ca + ' · ' : '') + cenario.feat + ' › ' + cenario.titulo}
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-3">
        <Campo label="Ambiente testado">
          <input
            value={f.amb}
            onChange={(e) => set({ amb: e.target.value })}
            placeholder="Branch ou commit, ex.: develop · 9b81e07"
            className={cn(inputCls, 'font-mono text-[.88rem]')}
          />
        </Campo>
        <Campo label="Reprodução">
          <select value={f.repro} onChange={(e) => set({ repro: e.target.value as Repro })} className={selectCls}>
            {(Object.keys(REPRO) as Repro[]).map((k) => (
              <option key={k} value={k}>
                {REPRO[k]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo label="Título da Ocorrência">
        <input
          value={f.massa}
          onChange={(e) => set({ massa: e.target.value })}
          placeholder="Ex.: usuário editor, card sem imagem"
          className={inputCls}
        />
      </Campo>
      <Campo label="Descrição">
        <textarea
          rows={5}
          value={f.descricao}
          onChange={(e) => set({ descricao: e.target.value })}
          onPaste={(e) => {
            const files = [...e.clipboardData.files].filter((x) => x.type.startsWith('image/'))
            if (files.length) {
              e.preventDefault()
              void subir(files)
            }
          }}
          placeholder="Conte o que aconteceu: onde estava, o que fez, o que viu e o que deveria acontecer. Pode colar prints aqui (Ctrl+V)."
          className={areaCls}
        />
      </Campo>
      <Campo label="Prints">
        <PrintDrop
          prints={f.prints}
          enviando={enviando}
          onFiles={(fs) => void subir(fs)}
          onRemove={(p) => {
            // Na edição o arquivo só é apagado ao salvar (ou quando a ocorrência é excluída).
            if (!f.editando) void removerPrints(orgId, [p])
            setF((x) => ({ ...x, prints: x.prints.filter((y) => y.id !== p.id) }))
          }}
        />
      </Campo>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] bg-q-soft px-3.5 py-3">
        <p className="m-0 flex-[1_1_260px] text-[.9rem]">
          A IA organiza título, onde ocorre, passos, situação atual e ajuste esperado, e aponta o que falta para o dev reproduzir.
        </p>
        <Button variant="primario" size="mini" disabled={organizando} onClick={() => void doOrganizar()}>
          {organizando ? 'Organizando…' : organizado ? 'Organizar de novo' : 'Organizar'}
        </Button>
        {!f.struct && (
          <Button variant="linha" size="mini" className="font-medium" onClick={() => set({ struct: true })}>
            Preencher manualmente
          </Button>
        )}
      </div>

      {f.struct && (
        <>
          <div className="mt-2 mb-3.5 flex items-center gap-2.5 text-[.9rem] font-semibold text-q-accent">
            Como o dev vai ver
            <span className="h-px flex-1 bg-q-line" />
          </div>
          <Campo label="Onde ocorre">
            <input value={f.onde} onChange={(e) => set({ onde: e.target.value })} className={inputCls} />
          </Campo>
          <Area label="Como reproduzir" dica="Um passo por linha." rows={3} v={f.passosT} on={(v) => set({ passosT: v })} />
          <Area label="Situação atual" rows={2} v={f.atual} on={(v) => set({ atual: v })} />
          <Area label="Mensagem de erro (opcional)" rows={2} v={f.erro} on={(v) => set({ erro: v })} mono />
          <Area
            label="Ajuste esperado"
            dica="Um item por linha. Comece a linha com > para destacar um texto exato que deve aparecer na tela."
            rows={3}
            v={f.espT}
            on={(v) => set({ espT: v })}
          />
          <Area label="Observação (opcional)" rows={2} v={f.obs} on={(v) => set({ obs: v })} />
        </>
      )}
    </Modal>
  )
}

function Area({
  label,
  dica,
  rows,
  v,
  on,
  mono,
}: {
  label: string
  dica?: ReactNode
  rows: number
  v: string
  on: (v: string) => void
  mono?: boolean
}) {
  return (
    <Campo label={label} dica={dica}>
      <textarea rows={rows} value={v} onChange={(e) => on(e.target.value)} className={cn(areaCls, mono && 'font-mono text-[.84rem]')} />
    </Campo>
  )
}
