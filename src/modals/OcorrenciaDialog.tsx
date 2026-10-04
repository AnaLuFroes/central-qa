import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/auth/AuthProvider'
import { criarModulo } from '@/data/modulos'
import { criarOcorrencia, novoIdOcorrencia, salvarOcorrencia } from '@/data/ocorrencias'
import { enviarPrint, removerPrints } from '@/data/prints'
import { lines } from '@/lib/format'
import { organizar } from '@/lib/organizar'
import { cn } from '@/lib/utils'
import { PrintDrop } from '@/modals/PrintDrop'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setDraftOcorrencia, type FormOcorrencia } from '@/store/slices/drafts'
import { moduloPorNome, selModulosOrdenados } from '@/store/slices/selectors'
import { abrir } from '@/store/slices/ui'
import type { Ocorrencia, Prioridade, Tipo } from '@/types'

/** O que abrir: nova (com módulo sugerido), edição ou duplicação de uma ocorrência. */
export type AlvoOcorrencia =
  | { modo: 'nova'; modulo?: string }
  | { modo: 'editar'; ocorrencia: Ocorrencia }
  | { modo: 'duplicar'; ocorrencia: Ocorrencia }

const vazio = (modulo = ''): FormOcorrencia => ({
  docId: novoIdOcorrencia(),
  editando: false,
  titulo: '',
  modulo,
  tipo: 'erro',
  prioridade: 'normal',
  descricao: '',
  onde: '',
  passosT: '',
  atual: '',
  erro: '',
  espT: '',
  obs: '',
  prints: [],
  struct: false,
})

const deOcorrencia = (o: Ocorrencia, modulo: string, editando: boolean): FormOcorrencia => ({
  docId: editando ? o.id : novoIdOcorrencia(),
  editando,
  titulo: editando ? o.titulo : `${o.titulo} (cópia)`,
  modulo,
  tipo: o.tipo,
  prioridade: o.prioridade,
  descricao: o.descricao,
  onde: o.onde,
  passosT: o.passos.join('\n'),
  atual: o.atual,
  erro: o.erro,
  espT: o.esperado.join('\n'),
  obs: o.obs,
  // A cópia não reaproveita os arquivos de print da original.
  prints: editando ? o.prints : [],
  struct: !!(o.onde || o.atual || o.passos.length),
})

const campo =
  'bg-background text-[.94rem] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-accent'

export function OcorrenciaDialog({ alvo, onClose }: { alvo: AlvoOcorrencia | null; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const { user } = useAuth()
  const modulos = useAppSelector(selModulosOrdenados)
  const draft = useAppSelector((s) => s.drafts.ocorrencia)
  const [f, setF] = useState<FormOcorrencia | null>(null)
  const [status, setStatus] = useState<{ t: string; bad: boolean }>({ t: '', bad: false })
  const [organizando, setOrganizando] = useState(false)
  const [organizado, setOrganizado] = useState(false)
  const [enviando, setEnviando] = useState(0)
  const [salvando, setSalvando] = useState(false)

  // Inicializa o formulário ao abrir. Ocorrência nova retoma o rascunho persistido, se houver.
  useEffect(() => {
    if (!alvo) return setF(null)
    const nomeDe = (id: string) => modulos.find((m) => m.id === id)?.nome ?? ''
    if (alvo.modo === 'nova')
      setF(draft ? { ...draft, modulo: draft.modulo || alvo.modulo || '' } : vazio(alvo.modulo))
    else setF(deOcorrencia(alvo.ocorrencia, nomeDe(alvo.ocorrencia.moduloId), alvo.modo === 'editar'))
    setStatus({ t: '', bad: false })
    setOrganizado(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo])

  // Rascunho: só para ocorrências novas, salvo a cada alteração (persistido e cifrado).
  useEffect(() => {
    if (f && !f.editando && alvo?.modo === 'nova') dispatch(setDraftOcorrencia(f))
  }, [f, alvo, dispatch])

  if (!alvo || !f) return null

  const set = (p: Partial<FormOcorrencia>) => setF((x) => (x ? { ...x, ...p } : x))
  const ehRascunho = alvo.modo === 'nova' && !!draft && (draft.titulo || draft.descricao || draft.prints.length)

  const subir = async (files: File[]) => {
    const imgs = files.filter((x) => x.type.startsWith('image/'))
    if (!imgs.length) return
    setEnviando((n) => n + imgs.length)
    for (const file of imgs) {
      try {
        const p = await enviarPrint(f.docId, file, user!.uid)
        setF((x) => (x ? { ...x, prints: [...x.prints, p] } : x))
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setEnviando((n) => n - 1)
      }
    }
  }

  const doOrganizar = async () => {
    if (!f.titulo.trim() && !f.descricao.trim())
      return setStatus({ t: 'Escreva um título ou uma descrição primeiro.', bad: true })
    setOrganizando(true)
    setStatus({ t: '', bad: false })
    try {
      const r = await organizar(f)
      set({ ...r, struct: true })
      setOrganizado(true)
      setStatus({ t: 'Pronto. Revise os campos e salve.', bad: false })
    } finally {
      setOrganizando(false)
    }
  }

  const salvar = async () => {
    const titulo = f.titulo.trim()
    if (!titulo) return setStatus({ t: 'Dê um título à ocorrência.', bad: true })
    if (enviando) return setStatus({ t: 'Aguarde o envio dos prints.', bad: true })
    setSalvando(true)
    try {
      const nomeMod = f.modulo.trim() || 'Geral'
      const moduloId = moduloPorNome(modulos, nomeMod)?.id ?? (await criarModulo({ nome: nomeMod, emoji: '', cor: null }))
      const dados = {
        moduloId,
        titulo,
        tipo: f.tipo,
        prioridade: f.prioridade,
        descricao: f.descricao.trim(),
        onde: f.onde.trim(),
        passos: lines(f.passosT),
        atual: f.atual.trim(),
        erro: f.erro.trim(),
        esperado: lines(f.espT),
        obs: f.obs.trim(),
        prints: f.prints,
      }
      if (f.editando) {
        await salvarOcorrencia(f.docId, dados)
        // Prints removidos na edição: apaga os documentos, a menos que um lote enviado ainda os mostre.
        if (alvo.modo === 'editar' && !alvo.ocorrencia.loteId)
          await removerPrints(alvo.ocorrencia.prints.filter((p) => !f.prints.some((x) => x.id === p.id)))
      } else await criarOcorrencia(dados, user!.uid, f.docId)
      if (alvo.modo === 'nova') dispatch(setDraftOcorrencia(null))
      dispatch(abrir(f.docId))
      toast.success('Ocorrência salva')
      onClose()
      nav(`/modulos/${moduloId}`)
    } catch (e) {
      setStatus({ t: 'Não foi possível salvar. ' + (e as Error).message, bad: true })
    } finally {
      setSalvando(false)
    }
  }

  const descartar = async () => {
    await removerPrints(f.prints)
    dispatch(setDraftOcorrencia(null))
    setF(vazio(alvo.modo === 'nova' ? alvo.modulo : ''))
    setStatus({ t: 'Rascunho descartado.', bad: false })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto p-6 sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[1.4rem]">
            {f.editando ? 'Editar ocorrência' : 'Nova ocorrência'}
          </DialogTitle>
          <DialogDescription>
            Escreva do seu jeito. Depois clique em “Organizar” para transformar no padrão de correção; você revisa antes
            de salvar.
          </DialogDescription>
        </DialogHeader>

        <Campo id="oc-titulo" label="Título">
          <Input
            id="oc-titulo"
            value={f.titulo}
            onChange={(e) => set({ titulo: e.target.value })}
            placeholder="Ex.: botão de aprovar duplicado no card"
            className={campo}
          />
        </Campo>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <Campo id="oc-modulo" label="Tela ou módulo">
            <Input
              id="oc-modulo"
              list="oc-mods"
              value={f.modulo}
              onChange={(e) => set({ modulo: e.target.value })}
              placeholder="Ex.: Tela inicial"
              className={campo}
            />
            <datalist id="oc-mods">
              {modulos.map((m) => (
                <option key={m.id} value={m.nome} />
              ))}
            </datalist>
          </Campo>
          <Campo id="oc-tipo" label="Tipo">
            <Select value={f.tipo} onValueChange={(v) => set({ tipo: v as Tipo })}>
              <SelectTrigger id="oc-tipo" className={cn(campo, 'w-full')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="erro">Erro</SelectItem>
                <SelectItem value="melhoria">Melhoria</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="oc-prio" label="Prioridade">
            <Select value={f.prioridade} onValueChange={(v) => set({ prioridade: v as Prioridade })}>
              <SelectTrigger id="oc-prio" className={cn(campo, 'w-full')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
        </div>

        <Campo id="oc-desc" label="Descrição">
          <Textarea
            id="oc-desc"
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
            className={campo}
          />
        </Campo>

        <div className="flex flex-col gap-1">
          <Label>Prints</Label>
          <PrintDrop
            prints={f.prints}
            enviando={enviando}
            onFiles={(fs) => void subir(fs)}
            onRemove={(p) => {
              // Na edição o arquivo só é apagado do Storage quando a ocorrência é excluída.
              if (!f.editando) void removerPrints([p])
              set({ prints: f.prints.filter((x) => x.id !== p.id) })
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-[10px] bg-accent px-3.5 py-3">
          <p className="m-0 flex-[1_1_260px] text-[.9rem]">
            Organiza título, onde ocorre, passos, situação atual e ajuste esperado a partir da sua descrição e dos prints.
          </p>
          <Button variant="gradient" onClick={doOrganizar} disabled={organizando}>
            <Sparkles />
            {organizando ? 'Organizando…' : organizado ? 'Organizar de novo' : 'Organizar'}
          </Button>
          {!f.struct && (
            <Button variant="subtle" onClick={() => set({ struct: true })}>
              Preencher manualmente
            </Button>
          )}
        </div>

        {f.struct && (
          <>
            <div className="mt-2 flex items-center gap-2.5 text-[.9rem] font-semibold text-primary">
              Como o dev vai ver
              <span className="h-px flex-1 bg-border" />
            </div>
            <Campo id="oc-onde" label="Onde ocorre">
              <Input id="oc-onde" value={f.onde} onChange={(e) => set({ onde: e.target.value })} className={campo} />
            </Campo>
            <Campo id="oc-passos" label="Como reproduzir" dica="Um passo por linha.">
              <Textarea id="oc-passos" rows={3} value={f.passosT} onChange={(e) => set({ passosT: e.target.value })} className={campo} />
            </Campo>
            <Campo id="oc-atual" label="Situação atual">
              <Textarea id="oc-atual" rows={2} value={f.atual} onChange={(e) => set({ atual: e.target.value })} className={campo} />
            </Campo>
            <Campo id="oc-erro" label="Mensagem de erro (opcional)">
              <Textarea
                id="oc-erro"
                rows={2}
                value={f.erro}
                onChange={(e) => set({ erro: e.target.value })}
                className={cn(campo, 'font-mono text-[.84rem]')}
              />
            </Campo>
            <Campo
              id="oc-esp"
              label="Ajuste esperado"
              dica="Um item por linha. Comece a linha com > para destacar um texto exato que deve aparecer na tela."
            >
              <Textarea id="oc-esp" rows={3} value={f.espT} onChange={(e) => set({ espT: e.target.value })} className={campo} />
            </Campo>
            <Campo id="oc-obs" label="Observação (opcional)">
              <Textarea id="oc-obs" rows={2} value={f.obs} onChange={(e) => set({ obs: e.target.value })} className={campo} />
            </Campo>
          </>
        )}

        <DialogFooter className="flex-row flex-wrap items-center gap-2 sm:justify-end">
          <span className={cn('mr-auto text-[.86rem]', status.bad ? 'text-destructive' : 'text-muted-foreground')}>
            {status.t}
          </span>
          {ehRascunho && (
            <Button variant="danger" onClick={descartar}>
              Descartar rascunho
            </Button>
          )}
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={salvar} disabled={salvando}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Campo({ id, label, dica, children }: { id: string; label: string; dica?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-[.86rem] font-semibold">
        {label}
      </Label>
      {children}
      {dica && <span className="text-[.8rem] text-muted-foreground">{dica}</span>}
    </div>
  )
}
