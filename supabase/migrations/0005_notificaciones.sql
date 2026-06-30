-- ============================================================================
-- Notificaciones in-app en tiempo real (Supabase Realtime).
-- Se generan automáticamente cuando cambia el estado de una solicitud o
-- cuando el admin sube el documento de resultado. El cliente las recibe en
-- vivo por Realtime (filtradas por RLS a sus propias notificaciones).
-- ============================================================================

create table public.notificaciones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  solicitud_id uuid references public.solicitudes(id) on delete cascade,
  tipo         text not null default 'general',
  titulo       text not null,
  mensaje      text not null,
  leida        boolean not null default false,
  created_at   timestamptz not null default now()
);
create index notificaciones_user_idx on public.notificaciones (user_id, leida);
create index notificaciones_created_idx on public.notificaciones (created_at desc);

alter table public.notificaciones enable row level security;

create policy notificaciones_select on public.notificaciones
  for select using (user_id = auth.uid());
create policy notificaciones_update on public.notificaciones
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Inserta una notificación al cambiar el estado de la solicitud.
create or replace function public.notify_solicitud_estado()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nombre text; v_msg text;
begin
  if NEW.estado is distinct from OLD.estado then
    select nombre into v_nombre from public.tramites where id = NEW.tramite_id;
    v_msg := case NEW.estado
      when 'en_proceso' then 'Tu trámite "'||coalesce(v_nombre,'')||'" está en proceso.'
      when 'completado' then 'Tu trámite "'||coalesce(v_nombre,'')||'" fue completado.'
      when 'entregado'  then 'Tu trámite "'||coalesce(v_nombre,'')||'" fue entregado. ¡Listo!'
      when 'cancelado'  then 'Tu trámite "'||coalesce(v_nombre,'')||'" fue cancelado.'
      else 'Tu trámite "'||coalesce(v_nombre,'')||'" cambió de estado.'
    end;
    insert into public.notificaciones (user_id, solicitud_id, tipo, titulo, mensaje)
    values (NEW.user_id, NEW.id, 'estado', 'Actualización de trámite', v_msg);
  end if;
  return NEW;
end; $$;

create trigger solicitudes_notify_estado
  after update on public.solicitudes
  for each row execute function public.notify_solicitud_estado();

-- Inserta una notificación cuando el admin sube el resultado.
create or replace function public.notify_resultado()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_nombre text;
begin
  if NEW.tipo = 'resultado_admin' then
    select s.user_id, t.nombre into v_user, v_nombre
    from public.solicitudes s join public.tramites t on t.id = s.tramite_id
    where s.id = NEW.solicitud_id;
    if v_user is not null then
      insert into public.notificaciones (user_id, solicitud_id, tipo, titulo, mensaje)
      values (v_user, NEW.solicitud_id, 'resultado', 'Documento listo',
              'El resultado de tu trámite "'||coalesce(v_nombre,'')||'" ya está disponible para descargar.');
    end if;
  end if;
  return NEW;
end; $$;

create trigger archivos_notify_resultado
  after insert on public.archivos
  for each row execute function public.notify_resultado();

alter publication supabase_realtime add table public.notificaciones;
