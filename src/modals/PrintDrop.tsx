import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { PrintImg } from '@/components/PrintImg'
import { cn } from '@/lib/utils'
import type { Print } from '@/types'

/** Área de prints: clique, arraste ou cole (Ctrl+V é tratado no textarea da descrição). */
export function PrintDrop({
  prints,
  enviando,
  onFiles,
  onRemove,
}: {
  prints: Print[]
  enviando: number
  onFiles: (files: File[]) => void
  onRemove: (p: Print) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          onFiles([...e.dataTransfer.files])
        }}
        className={cn(
          'flex items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-primary bg-accent px-4 py-3.5 text-left hover:border-solid',
          over && 'border-solid brightness-[.98]',
        )}
      >
        <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-[linear-gradient(135deg,#8FF0F2,#C39BF5)] text-navy-deep">
          {enviando ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        </span>
        <span className="flex flex-col leading-[1.35]">
          <b className="text-[.94rem] text-primary">{enviando ? `Enviando ${enviando}…` : 'Adicionar prints'}</b>
          <small className="text-[.82rem] text-muted-foreground">
            Clique para escolher, arraste para cá ou cole com Ctrl+V na descrição
          </small>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
      {prints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {prints.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-lg border bg-card">
              <PrintImg p={p} className="h-20 w-auto max-w-40 object-cover" />
              <button
                type="button"
                onClick={() => onRemove(p)}
                aria-label={`Remover ${p.nome}`}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-md bg-[rgba(14,16,39,.65)] text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
