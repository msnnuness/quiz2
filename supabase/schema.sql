-- ============================================================
--  PROGRAMA 21D — schema completo
--  Rode no SQL Editor do Supabase, de uma vez só.
-- ============================================================
--
--  ATENÇÃO DE SEGURANÇA
--  A chave anon fica exposta no navegador. Sem RLS, qualquer
--  pessoa com o DevTools aberto lê TODAS as respostas do quiz,
--  incluindo as perguntas íntimas. As políticas abaixo deixam
--  o front apenas ESCREVER; leitura só com a service_role
--  (backend/n8n) ou por usuário autenticado no que é dele.
--  Não afrouxe isso para "facilitar o debug".
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. quiz_sessions — uma linha por visita ao quiz
-- ------------------------------------------------------------
create table if not exists public.quiz_sessions (
  session_id    uuid primary key,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,

  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  src           text,
  fbclid        text,
  gclid         text,
  ttclid        text,

  landing_page  text,
  referrer      text,
  user_agent    text
);

create index if not exists idx_sessions_created  on public.quiz_sessions (created_at desc);
create index if not exists idx_sessions_campaign on public.quiz_sessions (utm_campaign, utm_content);

-- ------------------------------------------------------------
-- 2. quiz_answers — uma linha por resposta
-- ------------------------------------------------------------
create table if not exists public.quiz_answers (
  id           bigint generated always as identity primary key,
  session_id   uuid not null references public.quiz_sessions(session_id) on delete cascade,
  question_id  text not null,
  answer       jsonb not null,          -- string ou array (múltipla escolha)
  is_sensitive boolean not null default false,
  created_at   timestamptz not null default now(),

  unique (session_id, question_id)      -- permite upsert se o cara voltar
);

create index if not exists idx_answers_session on public.quiz_answers (session_id);

-- ------------------------------------------------------------
-- 3. quiz_results — pontuação e prioridades calculadas
-- ------------------------------------------------------------
create table if not exists public.quiz_results (
  session_id  uuid primary key references public.quiz_sessions(session_id) on delete cascade,
  scores      jsonb  not null,          -- { energy, sleep, consistency, confidence }
  priorities  text[] not null,          -- ['confidence','sleep','energy'] em ordem
  goal        text,                     -- ENERGY | LIBIDO | PERFORMANCE | CONTROL | WELLBEING
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. customers — quem comprou
-- ------------------------------------------------------------
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,             -- liga ao auth.users quando ele criar login
  session_id   uuid references public.quiz_sessions(session_id) on delete set null,

  email        text not null,
  name         text,
  phone        text,
  nickname     text,                    -- apelido usado na comunidade

  status       text not null default 'active'
               check (status in ('active','refunded','cancelled','expired')),
  order_ref    text,                    -- id da transação no checkout
  started_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),

  unique (email)
);

create index if not exists idx_customers_session on public.customers (session_id);

-- ------------------------------------------------------------
-- 5. program_progress — controle dos 21 dias
-- ------------------------------------------------------------
create table if not exists public.program_progress (
  id            bigint generated always as identity primary key,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  day_number    int  not null check (day_number between 1 and 21),
  unlocked_at   timestamptz,
  completed_at  timestamptz,
  actions_done  jsonb not null default '[]'::jsonb,

  unique (customer_id, day_number)
);

create index if not exists idx_progress_customer on public.program_progress (customer_id);

-- ------------------------------------------------------------
-- 6. daily_checkins — o registro diário
-- ------------------------------------------------------------
create table if not exists public.daily_checkins (
  id           bigint generated always as identity primary key,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  day_number   int  not null check (day_number between 1 and 21),
  checkin_date date not null default current_date,

  energy       int check (energy between 1 and 5),
  sleep_hours  numeric(3,1),
  mood         int check (mood between 1 and 5),
  note         text,

  created_at   timestamptz not null default now(),

  unique (customer_id, day_number)
);

create index if not exists idx_checkins_customer on public.daily_checkins (customer_id, checkin_date desc);

-- ------------------------------------------------------------
-- 7. community_posts
-- ------------------------------------------------------------
create table if not exists public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  nickname    text not null,
  body        text not null check (char_length(body) between 1 and 2000),

  status      text not null default 'published'
              check (status in ('published','hidden','flagged','removed')),
  likes_count int  not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_posts_feed on public.community_posts (created_at desc) where status = 'published';

-- ------------------------------------------------------------
-- 8. community_comments
-- ------------------------------------------------------------
create table if not exists public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  nickname    text not null,
  body        text not null check (char_length(body) between 1 and 1000),

  status      text not null default 'published'
              check (status in ('published','hidden','flagged','removed')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_comments_post on public.community_comments (post_id, created_at);


-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================

alter table public.quiz_sessions      enable row level security;
alter table public.quiz_answers       enable row level security;
alter table public.quiz_results       enable row level security;
alter table public.customers          enable row level security;
alter table public.program_progress   enable row level security;
alter table public.daily_checkins     enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;

-- ---------- QUIZ: o front só escreve, nunca lê ----------

create policy "anon insere sessao"
  on public.quiz_sessions for insert to anon with check (true);

create policy "anon atualiza propria sessao"
  on public.quiz_sessions for update to anon using (true) with check (true);

create policy "anon insere resposta"
  on public.quiz_answers for insert to anon with check (true);

create policy "anon atualiza resposta"
  on public.quiz_answers for update to anon using (true) with check (true);

create policy "anon insere resultado"
  on public.quiz_results for insert to anon with check (true);

create policy "anon atualiza resultado"
  on public.quiz_results for update to anon using (true) with check (true);

-- Nenhuma policy de SELECT para anon: leitura só via service_role,
-- que ignora RLS. É isso que impede alguém de baixar sua base inteira.

-- ---------- CLIENTE: enxerga apenas o que é dele ----------

create policy "cliente le proprio cadastro"
  on public.customers for select to authenticated
  using (auth_user_id = auth.uid());

create policy "cliente atualiza proprio cadastro"
  on public.customers for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "cliente le proprio progresso"
  on public.program_progress for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

create policy "cliente escreve proprio progresso"
  on public.program_progress for all to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()))
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

create policy "cliente le proprios checkins"
  on public.daily_checkins for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

create policy "cliente escreve proprios checkins"
  on public.daily_checkins for all to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()))
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

-- ---------- COMUNIDADE: membro ativo lê o feed, escreve como si mesmo ----------

create policy "membro le feed"
  on public.community_posts for select to authenticated
  using (
    status = 'published'
    and exists (select 1 from public.customers c where c.auth_user_id = auth.uid() and c.status = 'active')
  );

create policy "membro publica"
  on public.community_posts for insert to authenticated
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid() and status = 'active'));

create policy "membro edita proprio post"
  on public.community_posts for update to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()))
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

create policy "membro le comentarios"
  on public.community_comments for select to authenticated
  using (
    status = 'published'
    and exists (select 1 from public.customers c where c.auth_user_id = auth.uid() and c.status = 'active')
  );

create policy "membro comenta"
  on public.community_comments for insert to authenticated
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid() and status = 'active'));


-- ============================================================
--  VIEWS DE ANÁLISE (use com service_role)
-- ============================================================

-- Funil por criativo: onde o tráfego morre
create or replace view public.v_funnel_por_criativo as
select
  s.utm_campaign,
  s.utm_content,
  count(*)                                              as sessoes,
  count(*) filter (where a.respostas > 0)               as iniciaram,
  count(*) filter (where s.completed_at is not null)    as completaram,
  round(100.0 * count(*) filter (where s.completed_at is not null) / nullif(count(*),0), 1) as taxa_conclusao,
  count(c.id)                                           as compras
from public.quiz_sessions s
left join lateral (
  select count(*) as respostas from public.quiz_answers qa where qa.session_id = s.session_id
) a on true
left join public.customers c on c.session_id = s.session_id
group by 1, 2
order by sessoes desc;

-- Abandono por pergunta: qual tela derruba mais gente
create or replace view public.v_abandono_por_pergunta as
select
  question_id,
  count(distinct session_id) as chegaram
from public.quiz_answers
group by 1
order by chegaram desc;

-- Distribuição de objetivo declarado x conversão
create or replace view public.v_conversao_por_objetivo as
select
  r.goal,
  count(*)                                        as resultados,
  count(c.id)                                     as compras,
  round(100.0 * count(c.id) / nullif(count(*),0), 1) as taxa_compra
from public.quiz_results r
left join public.customers c on c.session_id = r.session_id
group by 1
order by resultados desc;
