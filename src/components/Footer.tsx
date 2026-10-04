export function Footer({ children = 'Central de QA' }: { children?: React.ReactNode }) {
  return <footer className="pt-12 pb-[30px] text-center text-[.92rem] text-muted-foreground">{children}</footer>
}
