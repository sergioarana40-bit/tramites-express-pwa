-- ============================================================================
-- Registro con nombre/apellidos/CURP → se guardan en el perfil del cliente.
-- El trigger lee la metadata del signup y arma datos_personales (incluyendo
-- el correo) para que los trámites se autollenen desde el primer momento.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nombre    text := nullif(trim(new.raw_user_meta_data->>'nombre'), '');
  v_apellidos text := nullif(trim(new.raw_user_meta_data->>'apellidos'), '');
  v_curp      text := nullif(trim(new.raw_user_meta_data->>'curp'), '');
  v_full      text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name',
                       concat_ws(' ', v_nombre, v_apellidos))), '');
  v_datos     jsonb := jsonb_build_object('correo', new.email);
begin
  if v_nombre    is not null then v_datos := v_datos || jsonb_build_object('nombre', v_nombre); end if;
  if v_apellidos is not null then v_datos := v_datos || jsonb_build_object('apellidos', v_apellidos); end if;
  if v_curp      is not null then v_datos := v_datos || jsonb_build_object('curp', v_curp); end if;

  insert into public.profiles (id, full_name, role, tipo_precio, datos_personales)
  values (new.id, coalesce(v_full, split_part(new.email, '@', 1)), 'cliente', 'publico', v_datos)
  on conflict (id) do nothing;
  return new;
end; $$;
