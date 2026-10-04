import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Print } from '@/types'

/**
 * Prints ficam na coleção `prints`, um documento por imagem, com a imagem em base64 (data URL)
 * no campo `dados`. A ocorrência e o lote guardam só a referência { id, nome }.
 * O Firestore limita cada documento a 1 MiB, então a imagem é reduzida e comprimida antes de salvar.
 */
export const printsCol = collection(db, 'prints')

const MAX_ENTRADA = 25 * 1024 * 1024
const MAX_DADOS = 900_000
const LADO_MAX = 1920

async function paraBase64(file: File): Promise<string> {
  const img = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  let escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height))
  try {
    for (let i = 0; i < 8; i++) {
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      for (const q of [0.85, 0.7, 0.55]) {
        const dados = canvas.toDataURL('image/webp', q)
        if (dados.length <= MAX_DADOS) return dados
      }
      escala *= 0.75
    }
  } finally {
    img.close()
  }
  throw new Error('Não foi possível reduzir a imagem para salvar.')
}

export async function enviarPrint(ocorrenciaId: string, file: File, uid: string): Promise<Print> {
  if (!file.type.startsWith('image/')) throw new Error('Envie apenas imagens.')
  if (file.size > MAX_ENTRADA) throw new Error('Imagem maior que 25 MB.')
  const nome = file.name || 'print.png'
  const dados = await paraBase64(file)
  const ref = await addDoc(printsCol, { ocorrenciaId, nome, dados, criadoPor: uid, criadoEm: serverTimestamp() })
  cache.set(ref.id, Promise.resolve(dados))
  return { id: ref.id, nome }
}

export async function removerPrints(prints: Print[]) {
  await Promise.all(
    prints.map((p) => {
      cache.delete(p.id)
      return deleteDoc(doc(printsCol, p.id)).catch(() => {})
    }),
  )
}

const cache = new Map<string, Promise<string>>()

/** Data URL do print (com cache em memória). */
export function carregarPrint(id: string): Promise<string> {
  let p = cache.get(id)
  if (!p) {
    p = getDoc(doc(printsCol, id)).then((s) => {
      const dados = s.get('dados')
      if (typeof dados !== 'string') throw new Error('Print não encontrado.')
      return dados
    })
    p.catch(() => cache.delete(id))
    cache.set(id, p)
  }
  return p
}

export function usePrint(id: string): string | null {
  const [src, setSrc] = useState<{ id: string; dados: string } | null>(null)
  useEffect(() => {
    let vivo = true
    carregarPrint(id)
      .then((dados) => vivo && setSrc({ id, dados }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [id])
  return src?.id === id ? src.dados : null
}

/** Abre o print em uma aba nova (o navegador bloqueia abrir data URL direto). */
export async function abrirPrint(id: string) {
  const aba = window.open('', '_blank')
  const blob = await (await fetch(await carregarPrint(id))).blob()
  const url = URL.createObjectURL(blob)
  if (aba) aba.location.href = url
  else window.open(url, '_blank')
}
