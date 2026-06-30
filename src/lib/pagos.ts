import { supabase } from './supabase'

// ============================================================================
// Pago SIMULADO para la demo.
// Marca la solicitud como pagada y deja registrado el precio_aplicado (que ya
// se fijó al crear la solicitud según el tipo de precio del cliente).
//
// // TODO: producción — sustituir por una pasarela real (Stripe / Mercado Pago):
//   1. Crear PaymentIntent/preferencia en el backend (Edge Function) con el
//      monto = precio_aplicado de la solicitud.
//   2. Redirigir al checkout / montar el widget de pago.
//   3. Confirmar el pago vía webhook firmado y, solo entonces, marcar pagado.
//   Nunca confiar en el cliente para marcar el pago como válido.
// ============================================================================

export interface ResultadoPago {
  ok: boolean
}

export async function pagarSolicitud(solicitudId: string): Promise<ResultadoPago> {
  // Simulamos latencia de la pasarela.
  await new Promise((r) => setTimeout(r, 700))

  const { error } = await supabase
    .from('solicitudes')
    .update({ pagado: true })
    .eq('id', solicitudId)

  if (error) throw error
  return { ok: true }
}
