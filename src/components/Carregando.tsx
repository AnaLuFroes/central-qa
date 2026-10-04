import { Loader2 } from 'lucide-react'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        {texto}
      </span>
    </div>
  )
}
