# Central de QA

Cadastre erros e melhorias, organize no padrão de correção e envie ao dev só o que ele precisa ver.

Implementação em React + Firebase do protótipo **“Central de QA redesenhada”** do Claude Design.

## Stack

- **Vite + React + TypeScript** com `react-router-dom`
- **Tailwind CSS v4 + shadcn/ui** (tema com os tokens do design em `src/index.css`) e **lucide-react** nos ícones
- **Redux Toolkit + redux-persist** com criptografia AES (`redux-persist-transform-encrypt`)
- **Firebase**: Auth, Firestore e Hosting (sem Cloud Functions e sem Storage)

## Níveis de acesso

| Nível | Pode |
|---|---|
| **Administrador** | Tudo o que o QA faz, mais a tela *Usuários e níveis* (`/admin/usuarios`) |
| **QA** | Módulos, ocorrências, prints, “Organizar”, gerar lotes, copiar link, baixar HTML |
| **Dev** | Vê os lotes (`/dev`) e marca fixes como concluídos. Não vê módulos nem ocorrências |
| **Pendente** | Conta nova, aguardando o administrador liberar |

O nível é o campo `role` do documento `users/{uid}` no Firestore. No primeiro acesso o app cria esse documento
como `pendente`. Para liberar alguém, edite o campo `role` no console do Firestore (`admin`, `qa`, `dev` ou `pendente`).
Depois que existir um admin, ele também pode alterar os níveis pela tela *Usuários e níveis*. As regras do Firestore
(`firestore.rules`) leem esse campo e aplicam os níveis no servidor.
Ninguém consegue criar o próprio perfil com outro nível nem alterar o próprio nível.

## Estado persistido (Redux)

- Ficam salvos: perfil, filtros, busca, cards abertos, seleção para o lote e rascunhos dos modais.
- Os dados do Firestore ficam fora do persist, porque o Firestore é a fonte da verdade e já tem cache offline.
- O estado de cada usuário fica em `localStorage["persist:central-qa:<uid>"]`, cifrado com AES.
- A chave é `VITE_PERSIST_SECRET` + uid.
- No logout, esse estado é apagado.

## Prints

Os prints não usam o Firebase Storage. Cada imagem é convertida para base64 (WebP, reduzida até caber em ~900 KB,
porque o Firestore limita cada documento a 1 MiB) e salva na coleção `prints`:

| Campo | Conteúdo |
|---|---|
| `ocorrenciaId` | ocorrência a que o print pertence |
| `nome` | nome original do arquivo |
| `dados` | a imagem em data URL base64 |
| `criadoPor`, `criadoEm` | quem enviou e quando |

A ocorrência (e o lote) guarda só a lista `prints: [{ id, nome }]`; a imagem é carregada sob demanda. O “Baixar HTML”
embute as imagens na página.

## Rodando

1. No [console do Firebase](https://console.firebase.google.com), ative Authentication (Google e E-mail/senha),
   Firestore.
2. Copie `.env.example` para `.env` e preencha com a config do app web.
3. **Uma vez só:** cole o conteúdo de `firestore.rules` em Firestore → Regras e clique em Publicar. Repita só quando esses arquivos mudarem.
4. `npm install` e `npm run dev`.
5. Crie sua conta no app e, no console do Firestore, troque o `role` do seu documento em `users` para `admin`.

Na Vercel, configure as mesmas variáveis `VITE_*` em Settings → Environment Variables e adicione o domínio da Vercel
em Authentication → Settings → Domínios autorizados.

## Estrutura

```
src/
  auth/        AuthProvider (login, nível vindo de users/{uid}), RequireRole, roles
  store/       store por usuário (persist cifrado), slices auth/ui/drafts/data, seletores
  data/        serviços Firestore e DataSync (onSnapshot -> Redux)
  components/  Hero, ModuleCard, FixCard, LoteCard, StatsCard… + components/ui (shadcn)
  modals/      Ocorrência, Módulo, Gerar lote, Enviar ao dev
  pages/       Modulos, Lotes, Modulo, Lote, DevHome, Login, Pendente, admin/Usuarios
  lib/         format (portado do protótipo), organizar, exportLote
firestore.rules
```

## Próximos passos

- “Organizar” com IA: hoje `src/lib/organizar.ts` usa a heurística local do protótipo. Ele pode virar uma Cloud Function
  que chama o Claude.
- “Usar imagem” como capa do módulo, que está no design e ainda não foi implementado.
