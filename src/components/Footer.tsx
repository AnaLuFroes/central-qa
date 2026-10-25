export function Footer({ texto = 'Central de QA' }: { texto?: string }) {
  return <footer className="px-5 pt-12 pb-[30px] text-center text-[.92rem] text-q-muted">{texto}</footer>
}
