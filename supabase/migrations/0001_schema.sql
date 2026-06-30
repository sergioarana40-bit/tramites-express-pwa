-- ============================================================================
-- Trámites Express — Esquema base, funciones, triggers y RLS
-- ============================================================================

-- ---------- Helpers --------------------------------------------------------
-- Nota: is_admin() se define más abajo, después de crear la tabla profiles
-- (su cuerpo SQL la referencia y debe existir al momento de crearla).

-- Mantiene updated_at al día.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles -------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'cliente' check (role in ('admin', 'cliente')),
  tipo_precio text not null default 'publico' check (tipo_precio in ('publico', 'mayorista')),
  created_at  timestamptz not null default now()
);

-- Devuelve true si el usuario actual es admin. SECURITY DEFINER para que la
-- consulta a profiles ignore RLS y así evitar recursión en las políticas.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Crea el profile automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, tipo_precio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'cliente',
    'publico'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- tramites (catálogo) --------------------------------------------

create table public.tramites (
  id               uuid primary key default gen_random_uuid(),
  categoria        text not null,
  nombre           text not null,
  descripcion      text,
  datos_requeridos text not null default '',
  precio_publico   numeric(10,2) not null default 0,
  precio_mayorista numeric(10,2) not null default 0,
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

create index tramites_categoria_idx on public.tramites (categoria);
create index tramites_activo_idx on public.tramites (activo);

-- ---------- solicitudes ----------------------------------------------------

create table public.solicitudes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  tramite_id       uuid not null references public.tramites(id) on delete restrict,
  estado           text not null default 'pendiente'
                     check (estado in ('pendiente','en_proceso','completado','entregado','cancelado')),
  datos_capturados jsonb not null default '{}'::jsonb,
  precio_aplicado  numeric(10,2) not null default 0,
  pagado           boolean not null default false,
  notas_admin      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index solicitudes_user_idx on public.solicitudes (user_id);
create index solicitudes_estado_idx on public.solicitudes (estado);
create index solicitudes_tramite_idx on public.solicitudes (tramite_id);

create trigger solicitudes_set_updated_at
  before update on public.solicitudes
  for each row execute function public.set_updated_at();

-- ---------- archivos -------------------------------------------------------

create table public.archivos (
  id             uuid primary key default gen_random_uuid(),
  solicitud_id   uuid not null references public.solicitudes(id) on delete cascade,
  tipo           text not null check (tipo in ('subido_usuario','resultado_admin')),
  storage_path   text not null,
  nombre_archivo text not null,
  uploaded_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index archivos_solicitud_idx on public.archivos (solicitud_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles    enable row level security;
alter table public.tramites    enable row level security;
alter table public.solicitudes enable row level security;
alter table public.archivos    enable row level security;

-- ---------- profiles -------------------------------------------------------
-- Cada quien ve su perfil; el admin ve todos.
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- El usuario edita su propio nombre; el admin edita cualquiera (rol/tipo_precio).
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- tramites -------------------------------------------------------
-- Clientes ven solo los activos; el admin ve todo y administra el catálogo.
create policy tramites_select on public.tramites
  for select using (activo = true or public.is_admin());
create policy tramites_insert_admin on public.tramites
  for insert with check (public.is_admin());
create policy tramites_update_admin on public.tramites
  for update using (public.is_admin()) with check (public.is_admin());
create policy tramites_delete_admin on public.tramites
  for delete using (public.is_admin());

-- ---------- solicitudes ----------------------------------------------------
-- El cliente ve/crea/edita las suyas; el admin ve y gestiona todas.
create policy solicitudes_select on public.solicitudes
  for select using (user_id = auth.uid() or public.is_admin());
create policy solicitudes_insert_own on public.solicitudes
  for insert with check (user_id = auth.uid());
create policy solicitudes_update_own on public.solicitudes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy solicitudes_update_admin on public.solicitudes
  for update using (public.is_admin()) with check (public.is_admin());
create policy solicitudes_delete_admin on public.solicitudes
  for delete using (public.is_admin());

-- ---------- archivos -------------------------------------------------------
-- Visibles/insertables por el dueño de la solicitud o el admin.
create policy archivos_select on public.archivos
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.solicitudes s
      where s.id = archivos.solicitud_id and s.user_id = auth.uid()
    )
  );
create policy archivos_insert on public.archivos
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.solicitudes s
      where s.id = archivos.solicitud_id and s.user_id = auth.uid()
    )
  );
create policy archivos_delete on public.archivos
  for delete using (
    public.is_admin()
    or exists (
      select 1 from public.solicitudes s
      where s.id = archivos.solicitud_id and s.user_id = auth.uid()
    )
  );
