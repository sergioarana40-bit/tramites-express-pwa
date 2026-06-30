import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'te-install-dismissed'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari
  (window.navigator as unknown as { standalone?: boolean }).standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)

/**
 * Banner emergente para instalar la PWA / agregarla a la pantalla de inicio.
 *  - Android/Chrome: usa el evento `beforeinstallprompt` → instalación con un toque.
 *  - iOS/Safari: muestra las instrucciones (iOS no permite instalar por código).
 * Aparece automáticamente y recuerda si el usuario lo cerró.
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return // ya está instalada
    if (localStorage.getItem(DISMISS_KEY)) return // el usuario ya lo cerró

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // En iOS no existe beforeinstallprompt: mostramos las instrucciones tras un momento.
    let t: ReturnType<typeof setTimeout> | undefined
    if (isIOS()) {
      t = setTimeout(() => setVisible(true), 1500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (t) clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const cerrar = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  const instalar = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      setDeferred(null)
    } else if (isIOS()) {
      setShowIOSHelp((s) => !s)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto max-w-md animate-[slideUp_0.3s_ease-out]">
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900 text-white shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-700">
              <img src="/favicon.svg" alt="" className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Instala Trámites Express</p>
              <p className="text-sm text-slate-300">Acceso directo desde tu pantalla de inicio.</p>
            </div>
            <button onClick={instalar} className="shrink-0 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400">
              {isIOS() && !deferred ? 'Cómo' : 'Instalar'}
            </button>
            <button onClick={cerrar} aria-label="Cerrar" className="shrink-0 p-1 text-slate-400 hover:text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {showIOSHelp && (
            <div className="border-t border-slate-700/50 px-4 py-3 text-sm text-slate-200">
              <p className="mb-1 font-medium">En iPhone/iPad:</p>
              <ol className="list-decimal space-y-1 pl-4 text-slate-300">
                <li>Toca el botón <span className="font-semibold">Compartir</span> (cuadro con flecha ↑).</li>
                <li>Elige <span className="font-semibold">«Agregar a inicio»</span>.</li>
                <li>Confirma con <span className="font-semibold">Agregar</span>.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
