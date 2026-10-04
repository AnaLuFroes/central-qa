import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/auth/AuthProvider'
import { criarLote } from '@/data/lotes'
import { INTRO, plural } from '@/lib/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setDraftLote, type FormLote } from '@/store/slices/drafts'
import { selSelecionadas } from '@/store/slices/selectors'
import { limparSelecao } from '@/store/slices/ui'

export function GerarLoteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const { user } = useAuth()
  const escolhidas = useAppSelector(selSelecionadas)
  const modulos = useAppSelector((s) => s.data.modulos)
  const draft = useAppSelector((s) => s.drafts.lote)
  const [f, setF] = useState<FormLote>({ titulo: '', eyebrow: '', intro: INTRO })
  const [status, setStatus] = useState('')
  const [gerando, setGerando] = useState(false)

  const nomesMods = [...new Set(escolhidas.map((o) => modulos.find((m) => m.id === o.moduloId)?.nome).filter(Boolean))]
  const reenviadas = escolhidas.filter((o) => o.loteId).length

  useEffect(() => {
    if (!open) return
    setF(draft ?? { titulo: nomesMods.length === 1 ? `Fixes de ${nomesMods[0]}` : 'Fixes da validação', eyebrow: '', intro: INTRO })
    setStatus('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) dispatch(setDraftLote(f))
  }, [f, open, dispatch])

  const set = (p: Partial<FormLote>) => setF((x) => ({ ...x, ...p }))

  const gerar = async () => {
    const titulo = f.titulo.trim()
    if (!titulo) return setStatus('Dê um título ao lote.')
    if (!escolhidas.length) return setStatus('Selecione ao menos uma ocorrência.')
    setGerando(true)
    try {
      const id = await criarLote({ titulo, eyebrow: f.eyebrow.trim(), intro: f.intro.trim() }, escolhidas, modulos, user!.uid)
      dispatch(limparSelecao())
      dispatch(setDraftLote(null))
      toast.success('Lote gerado')
      onClose()
      nav(`/lote/${id}`)
    } catch (e) {
      setStatus('Não foi possível gerar o lote. ' + (e as Error).message)
    } finally {
      setGerando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto p-6 sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[1.4rem]">Gerar lote para o dev</DialogTitle>
          <DialogDescription>
            {plural(escolhidas.length, 'ocorrência', 'ocorrências')} em {plural(nomesMods.length || 1, 'seção', 'seções')}. A
            numeração FIX 01, FIX 02… é criada na ordem das telas.
            {reenviadas > 0 && ` ${reenviadas} já ${reenviadas === 1 ? 'foi enviada' : 'foram enviadas'} em outro lote.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          <Label htmlFor="lt-titulo">Título da página</Label>
          <Input id="lt-titulo" value={f.titulo} onChange={(e) => set({ titulo: e.target.value })} className="bg-background" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="lt-eyebrow">Linha de contexto (opcional)</Label>
          <Input
            id="lt-eyebrow"
            value={f.eyebrow}
            onChange={(e) => set({ eyebrow: e.target.value })}
            placeholder="Ex.: SO5 · Gerador de Conteúdo"
            className="bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="lt-intro">Introdução</Label>
          <Textarea id="lt-intro" rows={3} value={f.intro} onChange={(e) => set({ intro: e.target.value })} className="bg-background" />
        </div>
        <DialogFooter className="flex-row flex-wrap items-center gap-2 sm:justify-end">
          <span className="mr-auto text-[.86rem] text-destructive">{status}</span>
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={gerar} disabled={gerando}>
            Gerar lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
