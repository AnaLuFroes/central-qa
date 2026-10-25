/** Baixa um arquivo gerado no navegador. */
export function baixar(nome: string, dados: Blob | string, tipo = 'text/plain;charset=utf-8') {
  const blob = typeof dados === 'string' ? new Blob([dados], { type: tipo }) : dados
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
