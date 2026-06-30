export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <div
      className={`${className} animate-spin rounded-full border-2 border-brand-200 border-t-brand-600`}
      role="status"
      aria-label="Cargando"
    />
  )
}

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-9 w-9" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}
