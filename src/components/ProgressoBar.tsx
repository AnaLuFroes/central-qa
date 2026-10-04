import { cn } from '@/lib/utils'

export function ProgressoBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${pct}% concluído`}
      className={cn('h-2 overflow-hidden rounded-full bg-track', className)}
    >
      <span className="block h-full rounded-full bg-brand-bar transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}
