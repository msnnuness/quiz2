# PROGRAMA 21D — Quiz

Funil: **Meta Ads (Mini VSL) → Quiz → Resultado → Oferta → Checkout → App de 21 dias**

React + Vite. Sem backend nesta etapa. Deploy como Static Site.

---

## Rodar local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist
npm run preview  # serve o /dist
```

---

## Onde mexer

Tudo que você troca no dia a dia está em **`src/config/app.config.js`**:

| O que | Constante |
|---|---|
| Preço | `PRICE.amount` + `PRICE.display` |
| URL do checkout | `CHECKOUT_URL` |
| Container do GTM | `GTM_ID` |
| Nome do produto | `PRODUCT.name` |
| Duração das animações | `TIMING` |

Enquanto `CHECKOUT_URL` e `GTM_ID` estiverem nos valores placeholder, nada é
disparado nem redirecionado — dá para testar sem sujar dado.

**Perguntas:** `src/data/questions.js` (conteúdo e pesos) e `src/data/flow.js`
(ordem das telas e transições). Adicionar ou remover pergunta recalibra a barra
de progresso e o scoring automaticamente.

**Textos do resultado:** `src/lib/results.js`.

---

## Como funciona o scoring

Quatro dimensões internas, 0 a 100: `energy`, `sleep`, `consistency`, `confidence`.

1. Cada opção em `questions.js` carrega `points` por dimensão.
2. Perguntas de múltipla escolha partem de `base` e sofrem descontos.
3. O máximo teórico por dimensão é **derivado do próprio banco de perguntas** —
   você mexe nos pesos sem recalibrar nada à mão.
4. Normaliza para 0–100 e limita entre `FLOOR` (18) e `CEIL` (94), em
   `src/lib/scoring.js`. Ajuste esses dois depois de ver dados reais.

**Prioridades:** as 3 menores pontuações, com a dimensão ligada ao
`primary_goal` forçada para o topo. Se a pontuação estiver alta, o texto vira
manutenção em vez de "merece atenção".

> O índice não é diagnóstico, medida hormonal nem avaliação de função sexual.
> A linguagem dos textos foi escrita para refletir isso. Se for editar, mantenha
> "com base nas respostas que você forneceu" e evite "detectamos que você tem".

---

## Tracking

Eventos no `dataLayer`, prontos para GTM:

```
quiz_view · quiz_start · quiz_answer · quiz_25 · quiz_50 · quiz_75
quiz_complete · result_view · offer_view · begin_checkout
```

Cada `quiz_answer` envia `question_id`, `answer` e `progress`.

**As perguntas marcadas com `sensitive: true` enviam `answer: "[sensitive]"`.**
Você mede abandono por etapa sem jogar resposta íntima dentro de plataforma de
anúncio. A resposta completa fica no localStorage e, se ligar, no seu Supabase.
Não remova essa flag para "melhorar o público" — além do risco de política, é
dado que não deveria sair do seu banco.

**Atribuição:** UTMs, `src`, `fbclid`, `gclid` e `ttclid` são capturados na
primeira visita e anexados à URL do checkout, com `fbclid` repassado como `sck`.

---

## Deploy (Render Static Site)

- Build command: `npm run build`
- Publish directory: `dist`
- Rewrite: `/*` → `/index.html` (Action: Rewrite)

Mesmo fluxo para Vercel ou Netlify.

---

## Supabase

Ainda desligado. Para ativar:

1. `npm i @supabase/supabase-js`
2. Rode `supabase/schema.sql` no SQL Editor (8 tabelas + RLS + 3 views)
3. Crie o `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Em `src/lib/persistence.js`: descomente os dois imports e mude
   `REMOTE_ENABLED` para `true`

Nenhum componente muda — todo o app fala só com `persistence.js`.

### Sobre a chave anon

A chave anon fica exposta no navegador. O schema **não dá SELECT para ela** de
propósito: o front só escreve. Sem isso, qualquer pessoa com o DevTools aberto
baixa todas as respostas do quiz, incluindo as perguntas sobre intimidade.

Para ler os dados (dashboard, n8n, Metabase), use a `service_role` no backend.

---

## Estrutura

```
src/
├── config/app.config.js     preço, checkout, GTM, tempos
├── data/
│   ├── questions.js         12 perguntas + pesos
│   └── flow.js              ordem das telas
├── lib/
│   ├── scoring.js           4 dimensões
│   ├── results.js           prioridades + headline por objetivo
│   ├── tracking.js          dataLayer, GTM, redação de dados sensíveis
│   ├── attribution.js       UTMs, session_id
│   └── persistence.js       localStorage + Supabase
├── hooks/useQuiz.js         estado, navegação, trava anti duplo clique
├── components/              ProgressHeader, OptionCard, ScoreBar, Icons
├── screens/                 Welcome, Question, Interstitial, Processing, Result
└── styles/index.css         tokens, animações, responsivo
```

---

## Checklist antes de subir

- [ ] `CHECKOUT_URL` preenchido
- [ ] `GTM_ID` preenchido
- [ ] Preço conferido em `PRICE`
- [ ] Rewrite `/*` → `/index.html` configurado no Render
- [ ] Aviso legal no rodapé revisado por quem responde pelo produto
- [ ] Teste em 375px, 390px e 430px
