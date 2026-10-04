/** Chave de cifra do estado persistido no navegador: VITE_PERSIST_SECRET + uid. */
export async function chavePersistencia(uid: string): Promise<string> {
  return `${import.meta.env.VITE_PERSIST_SECRET || 'central-qa'}:${uid}`
}
