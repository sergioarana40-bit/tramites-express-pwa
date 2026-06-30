-- ============================================================================
-- Seed reproducible — Trámites Express
--   • Catálogo importado desde catalogo_tramites.csv
--   • Usuarios de prueba (admin + cliente público + cliente mayorista)
--   • Solicitudes de ejemplo para poblar el dashboard
-- Idempotente: se puede correr varias veces.
--
-- ⚠️  DATOS DUMMY. Las "contraseñas" y credenciales de trámites son ficticias.
--     NUNCA sembrar credenciales reales de terceros.   // TODO: producción
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Catálogo (reemplaza el contenido por idempotencia) --------------
truncate table public.tramites restart identity cascade;

insert into public.tramites (categoria, nombre, datos_requeridos, precio_publico, precio_mayorista) values
('SAT','Constancia de Situación Fiscal (con contraseña)','RFC, contraseña del portal del SAT, correo electrónico',80,40),
('SAT','Constancia de Situación Fiscal EXPRES (sin contraseña)','CURP',300,200),
('SAT','Constancia de Situación Fiscal (sin contraseña)','CURP',250,165),
('SAT','Recuperación de contraseña SAT','RFC, correo registrado, celular',100,50),
('SAT','Opinión de cumplimiento','RFC, contraseña SAT',200,100),
('SAT','Actualización de datos RFC','RFC, contraseña SAT, dato a actualizar',140,70),
('SAT','CITA SAT','CURP, nombre completo, correo electrónico, teléfono de contacto, ciudad o estado donde deseas la cita',150,100),
('Documentos personales','CURP actualizada','Nombre completo, fecha de nacimiento, estado',10,5),
('Documentos personales','Actas de nacimiento certificadas','Nombre completo, fecha de nacimiento, estado, padres (CURP)',120,60),
('Documentos personales','Duplicado de certificado nivel básico','Acta de nacimiento del estudiante / CURP / INE / copia certificado o boleta',60,30),
('IMSS','Número de Seguro Social','CURP, correo, código postal',60,30),
('IMSS','Semanas cotizadas IMSS','CURP, NSS, correo',80,40),
('Becas y educación','Registro de becas','CURP alumno, CURP tutor, domicilio, teléfono',100,50),
('Otros trámites','Citas para trámites','CURP o RFC, nombre, teléfono, correo',150,75),
('Trámites legales y administrativos','Certificado de no antecedentes penales','CUTS, contraseña, INE',60,30),
('Trámites legales y administrativos','No deudor alimentario moroso nacional','CURP',20,10),
('Trámites legales y administrativos','No deudor alimentario moroso estatal','CUTS, contraseña, línea de pago',120,60),
('Trámites legales y administrativos','Constancia de no inhabilitación','Datos personales',50,25),
('Trámites legales y administrativos','Constancia de recepción de denuncia','CURP, INE, estado civil, datos de los hechos, correo, teléfono',45,22.50),
('Citas y trámites de gobierno','Citas para trámites de gobierno','CURP o RFC, nombre, teléfono, correo',80,40),
('Citas y trámites de gobierno','Cita INE','Datos solicitados por el sistema',45,22.50),
('Citas y trámites de gobierno','Cita pasaporte mexicano','CURP, datos personales, vigencia y número de pasaporte si es renovación',300,150),
('Citas y trámites de gobierno','CUTS (Cuenta Única de Trámites y Servicios)','CURP, datos generales, domicilio, correo electrónico, INE',60,30),
('Citas y trámites de gobierno','Llave MX','Correo electrónico, CURP del tutor o titular, número de teléfono',25,12.50),
('Servicios y pagos','Recibo CFE','Número de servicio, nombre del titular, monto a pagar',20,10),
('Servicios y pagos','Pago agua CDMX','Número de cuenta',20,10),
('Servicios y pagos','Predial','Clave catastral',25,12.50),
('Servicios y pagos','Tenencia','Datos del vehículo',20,10),
('Salud y comprobantes','Resultados laboratorios Salud Digna','Ticket, nombre completo, fecha de nacimiento, tipo de estudio',20,10),
('Salud y comprobantes','Certificado de discapacidad permanente','CURP',30,15),
('Comprobantes laborales','Comprobante pago jubilados ISSSTE','Número de pensión, código de deudo, año',20,10),
('Comprobantes laborales','Comprobante pago ISSEMYM','Usuario y contraseña',20,10),
('Comprobantes laborales','Comprobante pago maestros Edo. Méx','Usuario y contraseña',20,10);

-- ---------- Usuarios de prueba ---------------------------------------------
-- admin@tramitesexpress.mx     / Admin123!
-- cliente@tramitesexpress.mx   / Cliente123!   (público)
-- mayorista@tramitesexpress.mx / Mayorista123! (mayorista)
do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-0000000000a1';
  cli_id   uuid := '00000000-0000-0000-0000-0000000000c1';
  may_id   uuid := '00000000-0000-0000-0000-0000000000c2';
begin
  -- Reinicio idempotente (cascada a profiles/solicitudes).
  delete from auth.users where id in (admin_id, cli_id, may_id);

  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
     confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
     'admin@tramitesexpress.mx', extensions.crypt('Admin123!', extensions.gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}',
     '{"full_name":"Administrador"}', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', cli_id, 'authenticated', 'authenticated',
     'cliente@tramitesexpress.mx', extensions.crypt('Cliente123!', extensions.gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}',
     '{"full_name":"Cliente Público"}', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', may_id, 'authenticated', 'authenticated',
     'mayorista@tramitesexpress.mx', extensions.crypt('Mayorista123!', extensions.gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}',
     '{"full_name":"Cliente Mayorista"}', '', '', '', '');

  insert into auth.identities
    (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (admin_id::text, admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'admin@tramitesexpress.mx'), 'email', now(), now(), now()),
    (cli_id::text,   cli_id,   jsonb_build_object('sub', cli_id::text,   'email', 'cliente@tramitesexpress.mx'), 'email', now(), now(), now()),
    (may_id::text,   may_id,   jsonb_build_object('sub', may_id::text,   'email', 'mayorista@tramitesexpress.mx'), 'email', now(), now(), now());

  -- El trigger ya creó los profiles; ajustamos rol y tipo_precio.
  update public.profiles set role = 'admin',   tipo_precio = 'publico',   full_name = 'Administrador'     where id = admin_id;
  update public.profiles set role = 'cliente', tipo_precio = 'publico',   full_name = 'Cliente Público'   where id = cli_id;
  update public.profiles set role = 'cliente', tipo_precio = 'mayorista', full_name = 'Cliente Mayorista' where id = may_id;
end $$;

-- ---------- Solicitudes de ejemplo (para el dashboard) ----------------------
-- Mezcla de estados/meses; los pagados/entregados cuentan como ingresos.
insert into public.solicitudes (user_id, tramite_id, estado, datos_capturados, precio_aplicado, pagado, created_at, updated_at)
select s.user_id, t.id, s.estado, s.datos::jsonb, s.precio, s.pagado, s.fecha, s.fecha
from (values
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'CURP actualizada',                         'entregado',  '{"Nombre completo":"Juan Pérez (DEMO)","fecha de nacimiento":"1990-01-01","estado":"CDMX"}', 10.0,  true,  now() - interval '120 days'),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Semanas cotizadas IMSS',                   'completado', '{"CURP":"DEMO900101HDFXXX01","NSS":"00000000000","correo":"demo@correo.mx"}',                80.0,  true,  now() - interval '95 days'),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Recibo CFE',                               'entregado',  '{"Número de servicio":"000111222","nombre del titular":"Juan Pérez (DEMO)","monto a pagar":"450"}', 20.0, true, now() - interval '60 days'),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Cita INE',                                 'en_proceso', '{"Datos solicitados por el sistema":"DEMO"}',                                                45.0,  true,  now() - interval '20 days'),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Predial',                                  'pendiente',  '{"Clave catastral":"000-000-000 (DEMO)"}',                                                  25.0,  false, now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'Constancia de Situación Fiscal EXPRES (sin contraseña)', 'entregado', '{"CURP":"DEMO880202HDFXXX02"}',                                          200.0, true,  now() - interval '110 days'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'Cita pasaporte mexicano',                  'entregado',  '{"CURP":"DEMO880202HDFXXX02","datos personales":"DEMO"}',                                    150.0, true,  now() - interval '75 days'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'Opinión de cumplimiento',                  'completado', '{"RFC":"DEMO880202XXX","contraseña SAT":"********"}',                                        100.0, true,  now() - interval '45 days'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'Actas de nacimiento certificadas',         'en_proceso', '{"Nombre completo":"Ana López (DEMO)","fecha de nacimiento":"1988-02-02","estado":"Jalisco","padres (CURP)":"DEMO"}', 60.0, true, now() - interval '15 days'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'Número de Seguro Social',                  'pendiente',  '{"CURP":"DEMO880202HDFXXX02","correo":"demo@correo.mx","código postal":"06000"}',            30.0,  false, now() - interval '1 days')
) as s(user_id, tramite_nombre, estado, datos, precio, pagado, fecha)
join public.tramites t on t.nombre = s.tramite_nombre;
