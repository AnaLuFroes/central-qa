// Move os dados da versão 1 (coleções na raiz) para uma empresa da versão 2 (orgs/{orgId}/...).
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=chave.json npm run migrar -- --org "Minha Empresa" --sis "Portal" --ini PRT --superadmin <uid> [--dry-run]
//   (com FIRESTORE_EMULATOR_HOST=localhost:8080 roda no emulador)
//
// O que faz:
// - cria a empresa já ativa e um sistema com a sigla informada;
// - copia modulos, ocorrencias, lotes e prints para dentro da empresa, gerando o código SIGLA-NNN
//   de cada ocorrência (na ordem de criação) e trocando moduloId pelo nome do módulo;
// - converte lotes/{id}/progresso (fix marcado como feito) em respostas "Corrigido";
// - cria a equipe a partir de users.role (admin → Admin, qa → QA, dev → Dev; pendentes ficam de fora)
//   e grava orgId em cada users/{uid};
// - marca users/{superadmin}.superAdmin = true.
// As coleções antigas não são apagadas.
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, type DocumentData, type WriteBatch } from 'firebase-admin/firestore'

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf('--' + nome)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const orgNome = arg('org')
const sisNome = arg('sis')
const ini = (arg('ini') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
const superadmin = arg('superadmin')
const seco = process.argv.includes('--dry-run')

if (!orgNome || !sisNome || !ini) {
  console.error('Informe --org "Nome" --sis "Nome do sistema" --ini SIGLA [--superadmin uid] [--dry-run]')
  process.exit(1)
}

initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId: process.env.GCLOUD_PROJECT || 'demo-central-qa' } : { credential: applicationDefault() })
const db = getFirestore()

const PERFIL: Record<string, string> = { admin: 'Admin', qa: 'QA', dev: 'Dev' }
const pad = (n: number) => String(n).padStart(3, '0')

async function main() {
  const [mods, ocs, lotes, prints, users] = await Promise.all(
    ['modulos', 'ocorrencias', 'lotes', 'prints', 'users'].map((c) => db.collection(c).get()),
  )
  console.log(
    `Encontrado: ${mods.size} módulos, ${ocs.size} ocorrências, ${lotes.size} lotes, ${prints.size} prints, ${users.size} usuários.`,
  )

  const orgRef = db.collection('orgs').doc()
  const sisRef = orgRef.collection('sistemas').doc()
  const nomeMod = new Map(mods.docs.map((m) => [m.id, String(m.get('nome') || 'Geral')]))
  const admins = users.docs.filter((u) => u.get('role') === 'admin')
  const dono = admins[0]
  if (!dono) console.warn('Atenção: nenhum usuário com role "admin"; a empresa fica sem dono definido.')

  const ops: ((b: WriteBatch) => void)[] = []
  const set = (ref: FirebaseFirestore.DocumentReference, d: DocumentData, merge = false) =>
    ops.push((b) => (merge ? b.set(ref, d, { merge: true }) : b.set(ref, d)))

  set(orgRef, {
    nome: orgNome,
    status: 'ativa',
    donoUid: dono?.id ?? '',
    donoEmail: String(dono?.get('email') ?? '').toLowerCase(),
    criadoEm: FieldValue.serverTimestamp(),
    aprovadoPor: superadmin ?? 'migracao',
    aprovadoEm: FieldValue.serverTimestamp(),
  })

  for (const m of mods.docs) {
    const { nome, emoji, cor, criadoEm } = m.data()
    set(orgRef.collection('modulos').doc(m.id), { sis: sisRef.id, nome, nomeLower: String(nome).toLowerCase(), emoji: emoji ?? '', cor: cor ?? null, criadoEm: criadoEm ?? FieldValue.serverTimestamp() })
  }

  // Códigos na ordem de criação.
  const ordenadas = [...ocs.docs].sort((a, b) => (a.get('criadoEm')?.toMillis?.() ?? 0) - (b.get('criadoEm')?.toMillis?.() ?? 0))
  const codDe = new Map<string, string>()
  ordenadas.forEach((o, i) => codDe.set(o.id, `${ini}-${pad(i + 1)}`))
  for (const o of ordenadas) {
    const { moduloId, ...d } = o.data()
    set(orgRef.collection('ocorrencias').doc(o.id), {
      ...d,
      sis: sisRef.id,
      cod: codDe.get(o.id),
      modulo: nomeMod.get(moduloId) ?? 'Geral',
      amb: d.amb ?? '',
      repro: d.repro ?? '',
      massa: d.massa ?? '',
      assunto: '',
      cenario: null,
      status: '',
      hist: [],
      regFeatId: null,
      regEm: null,
    })
  }
  set(sisRef, { nome: sisNome, ini, cor: 0, capa: '', seq: ordenadas.length })

  let nResp = 0
  for (const l of lotes.docs) {
    const d = l.data()
    const secoes = (d.secoes ?? []).map((sc: { nome: string; itens: DocumentData[] }) => ({
      nome: sc.nome,
      itens: sc.itens.map((it) => ({ ...it, cod: codDe.get(it.ocorrenciaId) ?? '', modulo: sc.nome, amb: '', repro: '', massa: '', cenario: null, assunto: '' })),
    }))
    set(orgRef.collection('lotes').doc(l.id), { ...d, sis: sisRef.id, secoes })
    const prog = await l.ref.collection('progresso').get()
    for (const p of prog.docs) {
      if (!p.get('feito')) continue
      const em = p.get('em')?.toMillis?.() ?? Date.now()
      set(orgRef.collection('respostas').doc(`${l.id}__${p.id}`), {
        loteId: l.id,
        key: p.id,
        sis: sisRef.id,
        st: 'corrigido',
        pr: '',
        com: '',
        em,
        thread: [{ by: 'dev', st: 'corrigido', pr: '', txt: 'Marcado como concluído na versão anterior.', em, nome: '' }],
      })
      nResp++
    }
  }

  for (const p of prints.docs) set(orgRef.collection('prints').doc(p.id), p.data())

  let nEquipe = 0
  for (const u of users.docs) {
    const perfil = PERFIL[u.get('role')]
    const email = String(u.get('email') || '').toLowerCase()
    if (!perfil || !email) continue
    set(orgRef.collection('membros').doc(email), { email, nome: u.get('nome') ?? '', perfil, foto: u.get('foto') ?? '', uid: u.id, criadoEm: FieldValue.serverTimestamp() })
    set(u.ref, { orgId: orgRef.id }, true)
    nEquipe++
  }
  if (superadmin) set(db.collection('users').doc(superadmin), { superAdmin: true }, true)

  console.log(`Empresa ${orgRef.id} · sistema ${sisRef.id} (${ini}) · ${nResp} respostas · ${nEquipe} pessoas na equipe · ${ops.length} gravações.`)
  if (seco) {
    console.log('--dry-run: nada foi gravado.')
    return
  }
  for (let i = 0; i < ops.length; i += 400) {
    const b = db.batch()
    ops.slice(i, i + 400).forEach((op) => op(b))
    await b.commit()
  }
  console.log('Migração concluída.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
