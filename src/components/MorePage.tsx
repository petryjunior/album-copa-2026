import { useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { useAuth } from '@/context/AuthContext'
import { useCloudSync } from '@/context/CloudSyncContext'
import { useCollection } from '@/context/CollectionContext'
import { LimboSection } from '@/components/LimboSection'
import { buildShareDuplicatesText, buildShareMissingText } from '@/utils/shareTexts'

async function clipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

function formatDateTimeBr(iso: string | null): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return '—'
  return new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function MorePage({
  notify,
  onOpenSticker,
}: {
  notify: (msg: string) => void
  onOpenSticker: (entry: CatalogEntry) => void
}) {
  const { exportJson, importJson, clearAll, catalog, state, buildShareUrl, lastLocalSavedAt } = useCollection()
  const { user, loading: authLoading, cloudConfigured, signInWithGoogle, signOut } = useAuth()
  const { lastCloudPushAt, lastCloudError, pullDone } = useCloudSync()
  const [importArea, setImportArea] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-4 pb-40 text-sm text-slate-800">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Compartilhar texto</h2>
        <p className="mb-4 text-xs text-slate-600">
          Textos compatíveis com mensagens tipo WhatsApp. Ajuste como quiser depois de colar.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl bg-teal-700 px-3 py-3 text-xs font-semibold text-white hover:bg-teal-800 sm:text-sm"
            onClick={async () => {
              try {
                await clipboard(buildShareMissingText(catalog, state))
                notify('Lista de faltantes copiada.')
              } catch {
                notify('Copiar falhou; selecione o texto manualmente.')
              }
            }}
          >
            Copiar figurinhas faltando
          </button>
          <button
            type="button"
            className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3 text-xs font-semibold text-teal-950 hover:bg-teal-100 sm:text-sm"
            onClick={async () => {
              try {
                await clipboard(buildShareDuplicatesText(catalog, state))
                notify('Lista de repetidas copiada.')
              } catch {
                notify('Copiar falhou.')
              }
            }}
          >
            Copiar repetidas disponíveis
          </button>
        </div>
      </section>

      <LimboSection onOpenSticker={onOpenSticker} notify={notify} />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Conta e sincronização</h2>
        {authLoading ? (
          <p className="text-xs text-slate-500">Carregando sessão…</p>
        ) : cloudConfigured ? (
          <>
            {user ? (
              <>
                <p className="mb-1 text-xs text-slate-700">
                  Sessão: <span className="font-semibold">{user.email ?? user.id.slice(0, 8)}…</span>
                </p>
                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-3 text-xs text-slate-800">
                  <p className="font-semibold text-slate-900">Onde está salvo</p>
                  <ul className="mt-2 list-none space-y-1.5">
                    <li>
                      <span className="text-slate-600">Neste dispositivo (navegador): </span>
                      <time dateTime={lastLocalSavedAt ?? undefined}>{formatDateTimeBr(lastLocalSavedAt)}</time>
                    </li>
                    <li>
                      <span className="text-slate-600">Última cópia enviada para sua conta: </span>
                      {!pullDone ? (
                        <span className="text-slate-500">Sincronizando…</span>
                      ) : (
                        <time dateTime={lastCloudPushAt ?? undefined}>{formatDateTimeBr(lastCloudPushAt)}</time>
                      )}
                    </li>
                  </ul>
                  {lastCloudError ? (
                    <p className="mt-2 text-[11px] font-medium text-rose-700" role="alert">
                      {lastCloudError}
                    </p>
                  ) : null}
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-600">
                  Toque em <span className="font-semibold">Salvar</span> nas vistas onde edita figurinhas (grelha, seleção,
                  repetidas, editor) para enviar a coleção à nuvem — não há envio automático. Em outro celular ou PC, abra
                  o mesmo site e entre com a mesma conta Google; este aparelho também recebe dados mais novos da nuvem ao
                  focar o separador ou em segundo plano (consulta periódica).
                </p>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={async () => {
                    await signOut()
                    notify('Sessão encerrada neste dispositivo.')
                  }}
                >
                  Sair da conta
                </button>
              </>
            ) : (
              <>
                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-3 text-xs text-slate-800">
                  <p className="font-semibold text-slate-900">Neste dispositivo</p>
                  <p className="mt-1 text-slate-700">
                    Último salvamento local:{' '}
                    <time dateTime={lastLocalSavedAt ?? undefined}>{formatDateTimeBr(lastLocalSavedAt)}</time>
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                    As marcações ficam no armazenamento deste navegador. Entre com Google para salvar também na sua conta
                    na nuvem.
                  </p>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-600">
                  Entre com Google para poder usar <span className="font-semibold">Salvar</span> e guardar a coleção na
                  nuvem Supabase. O envio é manual; as alterações de outros dispositivos entram quando voltar à página ou
                  por sincronização em segundo plano.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className="mb-4 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
                  onClick={() => {
                    void signInWithGoogle()
                  }}
                >
                  Entrar com Google
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-xs text-amber-950">
              <p className="font-semibold">Neste dispositivo</p>
              <p className="mt-1">
                Último salvamento local:{' '}
                <time dateTime={lastLocalSavedAt ?? undefined}>{formatDateTimeBr(lastLocalSavedAt)}</time>
              </p>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-amber-900">
              Sincronização na nuvem não está configurada neste build (faltam{' '}
              <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_*</code>). Use o backup JSON ou o link abaixo.
            </p>
          </>
        )}

        <details className="group mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600">
            Alternativa sem conta — link comprido
          </summary>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            Copia um endereço que embute a coleção no próprio URL. Qualquer pessoa com o link vê os dados — use só se
            precisar e trate como privado.
          </p>
          <button
            type="button"
            disabled={busy}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            onClick={async () => {
              try {
                await clipboard(buildShareUrl())
                notify('Link copiado. Abra em outro dispositivo e aceite importar.')
              } catch {
                notify('Copiar falhou.')
              }
            }}
          >
            Copiar link com a coleção
          </button>
        </details>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Backup offline</h2>
        <p className="mb-3 text-xs text-slate-600">
          O progresso fica no armazenamento local deste navegador até importar de outro lugar. Exporte com frequência — o
          arquivo contém <code className="text-slate-800">&quot;version&quot;: 3</code> alinhado à ordem física
          (Panini&nbsp;00, FWC inicial, seleções, FWC final).
        </p>
        <button
          type="button"
          disabled={busy}
          className="mb-4 w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => {
            const blob = new Blob([exportJson()], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `album-copa-2026-${new Date().toISOString().slice(0, 10)}.json`
            anchor.click()
            URL.revokeObjectURL(url)
            notify('Backup baixado.')
          }}
        >
          Baixar JSON de backup
        </button>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Restaurar de um backup
        </label>
        <textarea
          value={importArea}
          placeholder="Cole aqui o conteúdo de um arquivo .json exportado..."
          rows={6}
          onChange={(e) => setImportArea(e.target.value)}
          className="mb-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-teal-500/30 focus:bg-white focus:ring-4"
        />
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            const attempt = importJson(importArea.trim())
            setBusy(false)
            if (!attempt.ok) {
              notify(attempt.error)
              return
            }
            setImportArea('')
            notify('Backup importado com sucesso!')
          }}
        >
          Importar coleção JSON
        </button>
      </section>

      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-inner">
        <h2 className="text-base font-black">Limpar coleção local</h2>
        <p className="mb-3 text-xs">
          Remove todas as marcações apenas neste dispositivo. Faça backup antes de continuar.
        </p>
        <button
          type="button"
          className="w-full rounded-2xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-800"
          onClick={() => {
            const ok = window.confirm('Apagar toda a coleção salva aqui?')
            if (!ok) return
            clearAll()
            notify('Armazenamento local limpo.')
          }}
        >
          Zerar coleção atual
        </button>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white/80 p-4 text-[11px] leading-relaxed text-slate-500">
        Copa do Mundo FIFA™ · Figurinha Panini™ são marcas registradas de seus proprietários — este projeto é só um
        controle offline feito pela comunidade para facilitar suas trocas, sem vínculo com a FIFA nem com a Editora Panini.
        Atualize a ordem ou os nomes no arquivo-fonte quando o checklist físico oficial divergir.
      </section>
    </div>
  )
}
