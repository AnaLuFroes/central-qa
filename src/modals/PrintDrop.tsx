import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
    <div className="flex flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
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
          'flex items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-[#5B45C8] bg-q-soft px-4 py-3.5 hover:border-solid',
          over && 'border-solid',
        )}
      >
        <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-[linear-gradient(135deg,#8FF0F2,#C39BF5)] text-navy-deep">
          {enviando ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="M21 16l-5-5-8 9" />
            </svg>
          )}
        </span>
        <span className="flex flex-col leading-[1.35]">
          <b className="text-[.94rem] text-q-accent">{enviando ? `Enviando ${enviando}…` : 'Adicionar prints'}</b>
          <small className="text-[.82rem] text-q-muted">Clique para escolher, arraste para cá ou cole com Ctrl+V na descrição</small>
        </span>
      </div>
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
        <div className="mt-2 flex flex-wrap gap-2.5">
          {prints.map((p, i) => (
            <div key={p.id} className="relative h-20 w-[120px] overflow-hidden rounded-lg border border-q-line">
              <PrintImg p={{ ...p, nome: 'Evidência ' + (i + 1) }} className="block size-full" />
              <button
                type="button"
                onClick={() => onRemove(p)}
                aria-label="Remover evidência"
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-[7px] border-0 bg-[rgba(14,16,39,.7)] text-white"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
