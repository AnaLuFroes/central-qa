import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { linkDoLote } from '@/data/lotes'
import type { Lote } from '@/types'

export async function copiarLink(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copiado')
  } catch {
    toast('Selecione o link e copie com Ctrl+C')
  }
}

export function EnviarDevDialog({ lote, onClose }: { lote: Lote | null; onClose: () => void }) {
  const url = lote ? linkDoLote(lote.id) : ''
  return (
    <Dialog open={!!lote} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-6 sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[1.4rem]">Enviar ao dev</DialogTitle>
          <DialogDescription>
            O dev abre este endereço e vê só a área de lotes, no formato de correção. Seus cadastros continuam privados.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          <Label htmlFor="link-lote">Link do lote “{lote?.titulo}”</Label>
          <div className="flex gap-2">
            <Input id="link-lote" readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-background" />
            <Button variant="gradient" onClick={() => copiarLink(url)}>
              <Copy /> Copiar
            </Button>
          </div>
        </div>
        <p className="m-0 rounded-[10px] bg-pendente-bg px-3.5 py-3 text-[.92rem]">
          O dev precisa entrar na Central de QA com uma conta liberada no nível <b>Dev</b> (o administrador faz isso em
          Usuários e níveis). Com esse nível ele marca os fixes concluídos e você acompanha o progresso aqui em tempo real.
          Quem tem nível Dev vê todos os lotes enviados; para mandar um lote isolado, use “Baixar HTML”.
        </p>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
