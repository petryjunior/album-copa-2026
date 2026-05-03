import { useAuth } from '@/context/AuthContext'
import { useCloudSync } from '@/context/CloudSyncContext'

type Props = {
  notify: (msg: string) => void
  className?: string
}

/** Envio manual à nuvem — sempre visível; ativo só com login + Supabase + pull inicial. */
export function ManualCloudSaveButton({ notify, className = '' }: Props) {
  const { user, loading: authLoading, cloudConfigured } = useAuth()
  const { pullDone, isPushing, pushToCloudNow } = useCloudSync()

  const ready =
    cloudConfigured && !!user && !authLoading && pullDone

  const title = (() => {
    if (isPushing) return 'A guardar na nuvem…'
    if (!cloudConfigured) return 'Nuvem não configurada (defina as variáveis do Supabase no deploy).'
    if (!user) return 'Abra «Mais» e entre com Google para guardar a coleção na conta.'
    if (authLoading) return 'A carregar a sessão…'
    if (!pullDone) return 'A sincronizar com a nuvem…'
    return 'Guardar a coleção na sua conta agora'
  })()

  return (
    <button
      type="button"
      disabled={!ready || isPushing}
      title={title}
      aria-busy={isPushing}
      aria-disabled={!ready || isPushing}
      onClick={async () => {
        if (!ready) return
        const ok = await pushToCloudNow()
        if (ok) notify('Cópia salva na sua conta.')
      }}
      className={`rounded-2xl border border-teal-600 bg-white px-3 py-2 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isPushing ? '…' : 'Salvar'}
    </button>
  )
}
