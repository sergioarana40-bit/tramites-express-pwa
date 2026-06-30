-- ============================================================================
-- Storage: bucket privado "documentos"
-- Convención de ruta: {owner_user_id}/{solicitud_id}/{archivo}
-- El primer segmento de la carpeta es el dueño de la solicitud, de modo que
-- tanto los documentos que sube el cliente como el resultado que sube el admin
-- viven en la misma carpeta y el cliente puede descargar su resultado.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Subir: el dueño (carpeta = su uid) o el admin.
create policy documentos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Leer/descargar: el dueño o el admin.
create policy documentos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Actualizar/eliminar: el dueño o el admin.
create policy documentos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy documentos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
