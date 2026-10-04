import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModuleCover } from '@/components/ModuleCover'
import { criarModulo, excluirModulo, salvarModulo } from '@/data/modulos'
import { EMOJIS, PALS, hashStr, plural, swatchBg } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import { moduloPorNome, selOcorrenciasPorModulo } from '@/store/slices/selectors'
import type { Modulo } from '@/types'

export function ModuloDialog({
  open,
  modulo,
  onClose,
}: {
  open: boolean
  modulo: Modulo | null
  onClose: () => void
}) {
  const modulos = useAppSelector((s) => s.data.modulos)
  const porModulo = useAppSelector(selOcorrenciasPorModulo)
  const nav = useNavigate()
  const [nome, setNome] = useState('')
  const [emoji, setEmoji] = useState('')
  const [cor, setCor] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return
    setNome(modulo?.nome ?? '')
    setEmoji(modulo?.emoji ?? '')
    setCor(modulo?.cor ?? null)
    setStatus('')
  }, [open, modulo])

  const nm = nome.trim() || 'Novo módulo'
  const corAtual = (cor ?? hashStr(nm)) % PALS.length

  const salvar = async () => {
    const n = nome.trim()
    if (!n) return setStatus('Dê um nome ao módulo.')
    const existente = moduloPorNome(modulos, n)
    if (existente && existente.id !== modulo?.id) return setStatus('Já existe um módulo com esse nome.')
    setSalvando(true)
    try {
      if (modulo) await salvarModulo(modulo.id, { nome: n, emoji, cor })
      else await criarModulo({ nome: n, emoji, cor })
      toast.success('Módulo salvo')
      onClose()
    } catch (e) {
      setStatus('Não foi possível salvar. ' + (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    if (!modulo) return
    const total = porModulo.get(modulo.id)?.length ?? 0
    if (total)
      return setStatus(`Mova ou exclua as ${plural(total, 'ocorrência', 'ocorrências')} deste módulo antes de excluí-lo.`)
    await excluirModulo(modulo.id)
    toast.success('Módulo excluído')
    onClose()
    nav('/')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto p-6 sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[1.4rem]">{modulo ? 'Editar módulo' : 'Novo módulo'}</DialogTitle>
          <DialogDescription>Cada módulo agrupa as ocorrências de uma tela ou área do sistema.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <ModuleCover nome={nm} emoji={emoji} cor={cor} className="h-[130px] rounded-xl" />
          <span className="absolute bottom-2.5 left-3.5 font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,.5)]">
            {nm}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="mod-nome">Nome</Label>
          <Input
            id="mod-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Telas de Login"
            className="bg-background"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Ícone</Label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ícone">
            {EMOJIS.map((e) => (
              <button
                key={e || 'none'}
                role="radio"
                aria-checked={emoji === e}
                onClick={() => setEmoji(e)}
                className={cn(
                  'grid size-[38px] place-items-center rounded-[10px] border bg-background text-[1.15rem] text-muted-foreground',
                  emoji === e && 'border-primary ring-3 ring-accent',
                )}
              >
                {e || <span className="font-serif text-sm">Aa</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Capa</Label>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Capa">
            {PALS.map((p, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={i === corAtual}
                aria-label={`Cor ${i + 1}`}
                onClick={() => setCor(i)}
                className={cn(
                  'h-[30px] w-[42px] rounded-lg border-2 border-transparent',
                  i === corAtual && 'border-primary ring-3 ring-accent',
                )}
                style={{ background: swatchBg(p) }}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center gap-2 sm:justify-end">
          <span className="mr-auto text-[.86rem] text-destructive">{status}</span>
          {modulo && (
            <Button variant="danger" onClick={excluir}>
              Excluir módulo
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
