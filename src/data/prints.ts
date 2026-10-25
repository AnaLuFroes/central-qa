import { useEffect, useState } from 'react'
import { addDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import type { Print } from '@/types'
import { orgCol, orgDoc } from './conv'

/**
 * Prints ficam em orgs/{orgId}/prints, um documento por imagem, com a imagem em base64 (data URL)
 * no campo `dados`. A ocorrência e o lote guardam só a referência { id, nome }.
 * O Firestore limita cada documento a 1 MiB, então a imagem é reduzida e comprimida antes de salvar.
 */
export const printsCol = (orgId: string) => orgCol(orgId, 'prints')

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

/** Capa (sistema ou módulo): até 900 px de largura, JPEG. */
export async function imagemCapa(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Envie apenas imagens.')
  const img = await createImageBitmap(file)
  try {
    const k = Math.min(1, 900 / img.width)
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * k)
    c.height = Math.round(img.height * k)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.85)
  } finally {
    img.close()
  }
}

/** Foto de perfil: recorte quadrado de 256 px no centro, JPEG. */
export async function imagemFoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Envie apenas imagens.')
  const img = await createImageBitmap(file)
  try {
    const S = 256
    const m = Math.min(img.width, img.height)
    const c = document.createElement('canvas')
    c.width = S
    c.height = S
    c.getContext('2d')!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S)
    return c.toDataURL('image/jpeg', 0.86)
  } finally {
    img.close()
  }
}

export async function enviarPrint(orgId: string, ocorrenciaId: string, file: File, uid: string): Promise<Print> {
  if (!file.type.startsWith('image/')) throw new Error('Envie apenas imagens.')
  if (file.size > MAX_ENTRADA) throw new Error('Imagem maior que 25 MB.')
  const nome = file.name || 'print.png'
  const dados = await paraBase64(file)
  const ref = await addDoc(printsCol(orgId), { ocorrenciaId, nome, dados, criadoPor: uid, criadoEm: serverTimestamp() })
  cache.set(ref.id, Promise.resolve(dados))
  return { id: ref.id, nome }
}

export async function removerPrints(orgId: string, prints: Print[]) {
  await Promise.all(
    prints.map((p) => {
      cache.delete(p.id)
      return deleteDoc(orgDoc(orgId, 'prints', p.id)).catch(() => {})
    }),
  )
}

const cache = new Map<string, Promise<string>>()

/** Data URL do print (com cache em memória). */
export function carregarPrint(orgId: string, id: string): Promise<string> {
  let p = cache.get(id)
  if (!p) {
    p = getDoc(orgDoc(orgId, 'prints', id)).then((s) => {
      const dados = s.get('dados')
      if (typeof dados !== 'string') throw new Error('Print não encontrado.')
      return dados
    })
    p.catch(() => cache.delete(id))
    cache.set(id, p)
  }
  return p
}

export function usePrint(orgId: string | null, id: string): string | null {
  const [src, setSrc] = useState<{ id: string; dados: string } | null>(null)
  useEffect(() => {
    if (!orgId) return
    let vivo = true
    carregarPrint(orgId, id)
      .then((dados) => vivo && setSrc({ id, dados }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [orgId, id])
  return src?.id === id ? src.dados : null
}
