import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/** Chips de filtro em pílula (Todas / Erros / …). */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
  label: string
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className="flex flex-wrap gap-2"
      spacing={2}
    >
      {options.map(([k, l]) => (
        <ToggleGroupItem
          key={k}
          value={k}
          className="h-auto rounded-full! border bg-card px-4 py-1.5 text-[0.9rem] font-medium text-muted-foreground hover:border-primary hover:bg-card hover:text-primary data-[state=on]:border-navy data-[state=on]:bg-navy data-[state=on]:text-white"
        >
          {l}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
