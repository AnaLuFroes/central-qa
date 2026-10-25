// Testes das regras do Firestore. Rodar com: npm run test:rules (sobe o emulador).
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, collectionGroup, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'

let env: RulesTestEnvironment

const pessoa = (uid: string, email: string, verificado = true) =>
  env.authenticatedContext(uid, { email, email_verified: verificado }).firestore()

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-central-qa',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users/root'), { email: 'root@cqa.com', superAdmin: true })
    await setDoc(doc(db, 'orgs/acme'), { nome: 'Acme', status: 'ativa', donoUid: 'adm', donoEmail: 'adm@acme.com' })
    await setDoc(doc(db, 'orgs/acme/membros/adm@acme.com'), { email: 'adm@acme.com', perfil: 'Admin', uid: 'adm' })
    await setDoc(doc(db, 'orgs/acme/membros/qa@acme.com'), { email: 'qa@acme.com', perfil: 'QA', uid: 'qa' })
    await setDoc(doc(db, 'orgs/acme/membros/dev@acme.com'), { email: 'dev@acme.com', perfil: 'Dev', uid: 'dev' })
    await setDoc(doc(db, 'orgs/acme/membros/novo@acme.com'), { email: 'novo@acme.com', perfil: 'QA', uid: null })
    await setDoc(doc(db, 'orgs/acme/sistemas/so5'), { nome: 'SO5', ini: 'SO5', cor: 0, capa: '', seq: 3 })
    await setDoc(doc(db, 'orgs/acme/ocorrencias/f1'), { titulo: 'x', tipo: 'erro', prioridade: 'normal', criadoPor: 'qa', cod: 'SO5-001' })
    await setDoc(doc(db, 'orgs/acme/lotes/l1'), { titulo: 'Lote', criadoPor: 'qa', secoes: [] })
    await setDoc(doc(db, 'orgs/acme/config/ia'), { provedor: 'anthropic', modelo: 'm', apiKey: 'k', baseURL: '', atualizadoPor: 'adm' })
    await setDoc(doc(db, 'orgs/beta'), { nome: 'Beta', status: 'suspensa', donoUid: 'b', donoEmail: 'b@beta.com' })
    await setDoc(doc(db, 'orgs/beta/membros/b@beta.com'), { email: 'b@beta.com', perfil: 'Admin', uid: 'b' })
    await setDoc(doc(db, 'orgs/beta/sistemas/s1'), { nome: 'S1', ini: 'S1', cor: 0, seq: 0 })
  })
})

describe('isolamento entre empresas e perfis', () => {
  it('QA lê e grava ocorrências da própria empresa', async () => {
    const db = pessoa('qa', 'qa@acme.com')
    await assertSucceeds(getDoc(doc(db, 'orgs/acme/ocorrencias/f1')))
    await assertSucceeds(
      setDoc(doc(db, 'orgs/acme/ocorrencias/f2'), { titulo: 'y', tipo: 'melhoria', prioridade: 'alta', criadoPor: 'qa', cod: 'SO5-004' }),
    )
  })
  it('o dev não lê ocorrências, mas lê lotes e responde', async () => {
    const db = pessoa('dev', 'dev@acme.com')
    await assertFails(getDoc(doc(db, 'orgs/acme/ocorrencias/f1')))
    await assertSucceeds(getDoc(doc(db, 'orgs/acme/lotes/l1')))
    await assertSucceeds(
      setDoc(doc(db, 'orgs/acme/respostas/l1__fix-01'), { loteId: 'l1', key: 'fix-01', sis: 'so5', st: 'corrigido', pr: 'PR 1', com: '', em: 1, thread: [] }),
    )
    await assertFails(setDoc(doc(db, 'orgs/acme/respostas/l9__fix-01'), { loteId: 'l9', key: 'fix-01', st: 'corrigido' }))
  })
  it('quem é de outra empresa não lê nada', async () => {
    const db = pessoa('b', 'b@beta.com')
    await assertFails(getDoc(doc(db, 'orgs/acme/lotes/l1')))
    await assertFails(getDoc(doc(db, 'orgs/acme/sistemas/so5')))
  })
  it('e-mail não verificado não acessa os dados', async () => {
    const db = pessoa('qa', 'qa@acme.com', false)
    await assertFails(getDoc(doc(db, 'orgs/acme/ocorrencias/f1')))
  })
  it('empresa suspensa não lê os dados', async () => {
    const db = pessoa('b', 'b@beta.com')
    await assertFails(getDoc(doc(db, 'orgs/beta/sistemas/s1')))
    await assertSucceeds(getDoc(doc(db, 'orgs/beta')))
  })
  it('empresa antiga ainda "pendente" funciona como ativa', async () => {
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'orgs/acme'), { status: 'pendente' }))
    await assertSucceeds(getDoc(doc(pessoa('qa', 'qa@acme.com'), 'orgs/acme/ocorrencias/f1')))
  })
  it('o código da ocorrência não muda na edição', async () => {
    const db = pessoa('qa', 'qa@acme.com')
    await assertFails(updateDoc(doc(db, 'orgs/acme/ocorrencias/f1'), { cod: 'SO5-999' }))
  })
})

describe('configuração de IA', () => {
  it('QA lê, só o Admin grava, o dev nem lê', async () => {
    await assertSucceeds(getDoc(doc(pessoa('qa', 'qa@acme.com'), 'orgs/acme/config/ia')))
    await assertFails(getDoc(doc(pessoa('dev', 'dev@acme.com'), 'orgs/acme/config/ia')))
    const ok = { provedor: 'openai', modelo: 'x', apiKey: 'k', baseURL: '', atualizadoPor: 'adm', em: 1 }
    await assertSucceeds(setDoc(doc(pessoa('adm', 'adm@acme.com'), 'orgs/acme/config/ia'), ok))
    await assertFails(setDoc(doc(pessoa('qa', 'qa@acme.com'), 'orgs/acme/config/ia'), { ...ok, atualizadoPor: 'qa' }))
  })
})

describe('sistemas', () => {
  it('QA só avança o contador e troca a capa', async () => {
    const db = pessoa('qa', 'qa@acme.com')
    await assertSucceeds(updateDoc(doc(db, 'orgs/acme/sistemas/so5'), { seq: 4 }))
    await assertFails(updateDoc(doc(db, 'orgs/acme/sistemas/so5'), { nome: 'Outro' }))
    await assertSucceeds(updateDoc(doc(pessoa('adm', 'adm@acme.com'), 'orgs/acme/sistemas/so5'), { nome: 'Outro' }))
  })
})

describe('equipe e convites', () => {
  it('o Admin convida; o QA não', async () => {
    const m = { email: 'x@acme.com', nome: 'X', perfil: 'Dev', foto: '', uid: null, criadoEm: 1 }
    await assertSucceeds(setDoc(doc(pessoa('adm', 'adm@acme.com'), 'orgs/acme/membros/x@acme.com'), m))
    await assertFails(setDoc(doc(pessoa('qa', 'qa@acme.com'), 'orgs/acme/membros/y@acme.com'), { ...m, email: 'y@acme.com' }))
  })
  it('o dono da conta continua Admin', async () => {
    await assertFails(updateDoc(doc(pessoa('adm', 'adm@acme.com'), 'orgs/acme/membros/adm@acme.com'), { perfil: 'QA' }))
  })
  it('o convidado acha o convite e se vincula com e-mail verificado', async () => {
    const db = pessoa('n1', 'novo@acme.com')
    await assertSucceeds(getDocs(query(collectionGroup(db, 'membros'), where('email', '==', 'novo@acme.com'))))
    const b = writeBatch(db)
    b.set(doc(db, 'users/n1'), { orgId: 'acme' }, { merge: true })
    b.update(doc(db, 'orgs/acme/membros/novo@acme.com'), { uid: 'n1' })
    await assertSucceeds(b.commit())
  })
  it('sem convite ou sem verificar, não se vincula', async () => {
    await assertFails(setDoc(doc(pessoa('n2', 'intruso@x.com'), 'users/n2'), { orgId: 'acme' }))
    await assertFails(setDoc(doc(pessoa('n1', 'novo@acme.com', false), 'users/n1'), { orgId: 'acme' }))
  })
  it('ninguém se promove a administrador da plataforma', async () => {
    await assertFails(setDoc(doc(pessoa('z', 'z@z.com'), 'users/z'), { email: 'z@z.com', superAdmin: true }))
  })
})

describe('cadastro de empresa e suspensão', () => {
  it('o dono cria a empresa já ativa com sistemas numa gravação só', async () => {
    const db = pessoa('d1', 'dona@nova.com', false)
    const b = writeBatch(db)
    b.set(doc(db, 'orgs/nova'), { nome: 'Nova', status: 'ativa', donoUid: 'd1', donoEmail: 'dona@nova.com', criadoEm: 1 })
    b.set(doc(db, 'orgs/nova/membros/dona@nova.com'), { email: 'dona@nova.com', nome: 'D', perfil: 'Admin', foto: '', uid: 'd1', criadoEm: 1 })
    b.set(doc(db, 'orgs/nova/sistemas/a'), { nome: 'Portal', ini: 'PC', cor: 0, capa: '', seq: 0 })
    b.set(doc(db, 'users/d1'), { orgId: 'nova' }, { merge: true })
    await assertSucceeds(b.commit())
  })
  it('não dá para criar a empresa já suspensa nem em nome de outro', async () => {
    const db = pessoa('d2', 'd2@x.com')
    await assertFails(setDoc(doc(db, 'orgs/x'), { nome: 'X', status: 'suspensa', donoUid: 'd2', donoEmail: 'd2@x.com', criadoEm: 1 }))
    await assertFails(setDoc(doc(db, 'orgs/y'), { nome: 'Y', status: 'ativa', donoUid: 'outro', donoEmail: 'd2@x.com', criadoEm: 1 }))
  })
  it('o dono acha a própria empresa e religa a conta, mesmo sem verificar o e-mail', async () => {
    const db = pessoa('adm', 'adm@acme.com', false)
    await assertSucceeds(getDocs(query(collection(db, 'orgs'), where('donoUid', '==', 'adm'))))
    await assertSucceeds(setDoc(doc(db, 'users/adm'), { orgId: 'acme' }, { merge: true }))
    await assertFails(getDocs(query(collection(pessoa('qa', 'qa@acme.com'), 'orgs'), where('donoUid', '==', 'adm'))))
  })
  it('só o administrador da plataforma suspende, reativa e lista empresas', async () => {
    await assertFails(updateDoc(doc(pessoa('adm', 'adm@acme.com'), 'orgs/acme'), { status: 'suspensa' }))
    const root = pessoa('root', 'root@cqa.com')
    await assertSucceeds(updateDoc(doc(root, 'orgs/beta'), { status: 'ativa', aprovadoPor: 'root', aprovadoEm: 1 }))
    await assertSucceeds(getDocs(collection(root, 'orgs')))
    await assertFails(getDocs(collection(pessoa('adm', 'adm@acme.com'), 'orgs')))
    await assertFails(getDoc(doc(root, 'orgs/acme/ocorrencias/f1')))
  })
})
