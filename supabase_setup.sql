-- ===============================================================
-- PLAY LIVE IPTV - CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ===============================================================

-- 1. Criar a tabela de playlists vinculadas a MAC e KEY
create table if not exists public.playlists (
    mac text primary key,
    device_key text not null,
    name text default 'Minha Lista',
    type text not null, -- 'm3u_url' ou 'xtream'
    url text,
    server_url text,
    username text,
    password text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Habilitar segurança a nível de linha (RLS)
alter table public.playlists enable row level security;

-- 3. Permitir leitura pública para que o app na TV consulte sua lista pelo MAC e KEY
create policy "Permitir leitura de playlists"
    on public.playlists
    for select
    using (true);

-- 4. Permitir inserção e atualização de playlists pelo portal web
create policy "Permitir inserção e atualização de playlists"
    on public.playlists
    for all
    using (true)
    with check (true);

-- ===============================================================
-- Pronto! Sua tabela está criada e configurada com acesso pela API.
-- ===============================================================
