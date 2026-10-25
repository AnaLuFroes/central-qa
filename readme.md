# Central de QA

Ocorrências, casos de teste e entregas ao dev em um só lugar.

Implementação em React + Firebase do protótipo **“Central de QA v2”** do Claude Design. O protótipo extraído fica em
`design/central-qa-v2.html` para referência.

## O que tem

- **Várias empresas.** Cada empresa se cadastra, aguarda aprovação da equipe da Central de QA e, depois, o administrador
  dela cadastra os sistemas e a equipe.
- **Sistemas.** Cada sistema tem os próprios módulos, ocorrências, lotes, casos de teste e rodadas. A sigla do sistema é
  o prefixo do código fixo das ocorrências (`SO5-001`).
- **Visão geral.** Fluxo das ocorrências, fila “Agora é com você”, módulos com pendências, última rodada e últimos lotes.
- **Ocorrências.**
  - Registro livre com prints e contexto do teste (ambiente, reprodução, perfil e dados).
  - “Organizar” com IA, que monta o padrão de correção.
  - Agrupamento automático por assunto.
  - Histórico e conversa com o dev.
  - Reteste: validar, reabrir, encerrar sem correção e transformar em cenário de regressão.
- **Lotes.** O QA seleciona e envia. O dev responde item a item:
  - Corrigido (com PR), Não consegui reproduzir, Preciso de mais informação, É o comportamento esperado ou Adiado.
  - O QA responde na conversa.
  - Também há o link do lote e o “Baixar HTML”.
- **Casos de teste.**
  - Critérios de aceite em Gherkin declarativo, com revisão e aprovação pelo PO.
  - Casos de teste gerados a partir dos critérios (API, E2E ou manual) para o Cypress, exportáveis em `.zip`.
  - Rodadas de execução: Passou, Falhou ou Bloqueado. Uma falha vira ocorrência ligada ao cenário.
- **Busca e atalhos.** Busca global (`/` ou `Ctrl+K`), atalhos `N`, `T`, `1`–`4`, `?` e `Esc`, tema claro e escuro.
- **Minha conta.** Perfil e foto; equipe e perfis (Admin); configuração de IA.
- **Backup.** Exporta e restaura os dados da empresa em JSON.

## Stack

- **Vite + React + TypeScript** com `react-router-dom`
- **Tailwind CSS v4 + shadcn/ui** (tokens claro/escuro em `src/index.css`) e **lucide-react** nos ícones
- **Redux Toolkit + redux-persist** com criptografia AES (`redux-persist-transform-encrypt`)
- **Firebase**: Auth, Firestore e Hosting (sem Cloud Functions e sem Storage)
- **IA no navegador:** `@anthropic-ai/sdk`, `openai` e `@google/genai`, carregados só quando usados

## Acesso

| Quem | Onde fica | Pode |
|---|---|---|
| **Administrador da plataforma** | `users/{uid}.superAdmin = true` (marcado à mão no console) | Tela `/plataforma/empresas`: aprova, suspende e reativa empresas. Não vê os dados internos delas |
| **Administrador da empresa** | `orgs/{orgId}/membros/{email}.perfil = 'Admin'` | Tudo do QA, mais sistemas da empresa, equipe e perfis, configuração de IA e restaurar backup |
| **QA** | `perfil = 'QA'` | Ocorrências, módulos, lotes, critérios, casos de teste, rodadas, busca e baixar backup |
| **Dev** | `perfil = 'Dev'` | Só os sistemas com lotes para ele; responde item a item. Não vê ocorrências, módulos nem casos |

Fluxos de acesso:

1. **Cadastro da empresa** (`/cadastro`).
   - Quem cria vira o administrador e cadastra os sistemas.
   - A empresa nasce `pendente`; os dados só ficam acessíveis depois que um administrador da plataforma aprova.
   - Contas criadas com e-mail e senha precisam confirmar o e-mail.
2. **Equipe.**
   - O administrador da empresa adiciona a pessoa (nome, e-mail, perfil) em *Minha conta › Equipe e perfis*.
   - A pessoa entra com Google ou em *Primeiro acesso* com o mesmo e-mail.
   - No primeiro login o app encontra o convite e liga a conta à empresa.
3. **Regras no servidor.** As regras do Firestore (`firestore.rules`) exigem e-mail verificado, empresa ativa e o perfil
   certo para cada coleção.

## Configuração de IA

Em *Minha conta › Configuração de IA*, o administrador escolhe o provedor e grava a chave da empresa:

- Anthropic (Claude);
- OpenAI;
- Google Gemini;
- “Compatível com OpenAI”, com URL base: OpenRouter, Groq, Azure, Ollama etc.

O botão *Testar conexão* confere a configuração. As chamadas saem direto do navegador (`src/lib/ia/index.ts`). Sem IA
configurada, ou se a chamada falhar, “Organizar” e a geração de critérios e casos usam o modelo básico local do
protótipo.

> A chave fica em `orgs/{orgId}/config/ia`, legível por QA e Admin da empresa, e é usada no navegador dessas pessoas.
> Use uma chave com limite de gastos e troque-a quando alguém sair da equipe.

## Dados (Firestore)

```
users/{uid}                     email, nome, foto, orgId, superAdmin?
orgs/{orgId}                    nome, status (pendente|ativa|suspensa), donoUid, donoEmail
  membros/{email}               nome, perfil (Admin|QA|Dev), foto, uid (null até o primeiro acesso)
  sistemas/{id}                 nome, ini (sigla), cor, capa, seq (contador dos códigos)
  modulos/{id}                  sis, nome, emoji, cor
  ocorrencias/{id}              sis, cod, modulo, corpo do fix, contexto, status, hist, regFeatId…
  lotes/{id}                    sis, titulo, eyebrow, intro, secoes[] (cópia das ocorrências no envio)
  respostas/{loteId__fix-NN}    st, pr, com, em, thread[] (conversa dev ↔ QA)
  features/{id}                 tipo (ca|casos), sis, modulo, nome, gherkin, caSt, caId, camada
  rodadas/{id}                  sis, nome, amb, itens[], res{}
  prints/{id}                   imagem em base64 (WebP, até ~900 KB)
  config/ia                     provedor, modelo, apiKey, baseURL
```

Os prints não usam o Firebase Storage: cada imagem é reduzida até caber em um documento. A ocorrência e o lote guardam
só `prints: [{ id, nome }]`.

## Estado persistido (Redux)

- **Fica salvo:** filtros, cards abertos, seleção para o lote, último ambiente e rascunhos (ocorrência, lote, respostas).
- **Fica de fora:** os dados do Firestore, porque o Firestore é a fonte da verdade e já tem cache offline.
- **Onde:** `localStorage["persist:central-qa-v2:<uid>"]`, cifrado com AES. A chave é `VITE_PERSIST_SECRET` + uid.
- **No logout:** esse estado é apagado.

## Rodando

1. No [console do Firebase](https://console.firebase.google.com):
   - ative Authentication (Google e E-mail/senha) e Firestore;
   - em Authentication › Templates, confira o e-mail de verificação.
2. Copie `.env.example` para `.env` e preencha com a config do app web.
3. Publique as regras e os índices com `npx firebase deploy --only firestore:rules,firestore:indexes`. O índice de
   `membros.email` em collection group é necessário para achar os convites.
4. `npm install` e `npm run dev`.
5. Marque o seu usuário como administrador da plataforma: em `users/{seu uid}`, adicione `superAdmin: true` (booleano).
   Depois aprove as empresas em `/plataforma/empresas`.

Na Vercel, configure as mesmas variáveis `VITE_*` em Settings › Environment Variables e adicione o domínio da Vercel
em Authentication › Settings › Domínios autorizados.

## Migrando da versão 1

A versão 1 guardava tudo na raiz (`modulos`, `ocorrencias`, `lotes`, `prints`, `users.role`). O script abaixo copia
esses dados para uma empresa nova, já ativa, com um sistema:

```bash
# teste antes, sem gravar nada
GOOGLE_APPLICATION_CREDENTIALS=chave-da-conta-de-servico.json \
  npm run migrar -- --org "Minha Empresa" --sis "Portal" --ini PRT --superadmin <seu-uid> --dry-run
# grava
GOOGLE_APPLICATION_CREDENTIALS=chave-da-conta-de-servico.json \
  npm run migrar -- --org "Minha Empresa" --sis "Portal" --ini PRT --superadmin <seu-uid>
```

O que o script faz:

- gera os códigos `PRT-001…` na ordem de criação;
- troca `moduloId` pelo nome do módulo;
- converte o progresso dos lotes em respostas “Corrigido”;
- cria a equipe a partir de `users.role` (`admin` vira Admin, `qa` vira QA, `dev` vira Dev);
- marca o `superAdmin` informado.

As coleções antigas não são apagadas.

## Testes

- `npm test`: regras de negócio (`src/lib/*.test.ts`).
- `npm run test:rules`: regras do Firestore no emulador (`tests/rules.test.ts`; precisa de Java).
- `npm run lint` e `npm run build`.

## Estrutura

```
src/
  auth/        AuthProvider (conta, empresa, perfil, situação), RequireRole, roles
  store/       store por usuário (persist cifrado), slices auth/ui/drafts/data/modal, seletores
  data/        serviços Firestore por coleção e DataSync (onSnapshot -> Redux)
  lib/         status, assuntos, gherkin, painel, backup, organizar, exportLote, ia/ (provedores e prompts)
  components/  TopBar, AppHeader, Modal, qa.tsx (peças do visual), FixCard… + components/ui (shadcn)
  modals/      Ocorrência, Módulo, Gerar lote, Link, Evidência, Critérios/Casos, Rodada, Busca, Atalhos
  pages/       Splash, Entrar, Cadastro, Aguardando, Sistemas, Conta, plataforma/Empresas, app/* (telas do sistema)
  theme/       tema claro/escuro
scripts/       migrar-para-org.ts
tests/         rules.test.ts
firestore.rules, firestore.indexes.json
```
