-- ============================================================================
-- Perfil del cliente (datos reutilizables) + requisitos por trámite
-- ============================================================================

-- Datos personales reutilizables del cliente; se usan para autollenar los
-- formularios dinámicos de los trámites. Estructura flexible (clave canónica →
-- valor): nombre_completo, curp, rfc, correo, telefono, fecha_nacimiento,
-- estado, domicilio, codigo_postal, nss, ine.
alter table public.profiles
  add column if not exists datos_personales jsonb not null default '{}'::jsonb;

-- Documentos que el cliente debe subir para el trámite (lista separada por comas).
alter table public.tramites
  add column if not exists documentos_requeridos text not null default '';

-- Ejemplos de documentos requeridos.
update public.tramites set documentos_requeridos = 'Acta de nacimiento, INE (o del tutor), copia del certificado o boleta anterior'
  where nombre = 'Duplicado de certificado nivel básico';
update public.tramites set documentos_requeridos = 'INE vigente (frente y reverso)'
  where nombre = 'Certificado de no antecedentes penales';
update public.tramites set documentos_requeridos = 'Ticket del estudio'
  where nombre = 'Resultados laboratorios Salud Digna';
update public.tramites set documentos_requeridos = 'INE, acta de nacimiento'
  where nombre = 'Actas de nacimiento certificadas';
update public.tramites set documentos_requeridos = 'Último recibo de CFE (foto)'
  where nombre = 'Recibo CFE';
