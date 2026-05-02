import { useState } from 'react'
import { useCollection } from '@/context/CollectionContext'
import { buildShareDuplicatesText, buildShareMissingText } from '@/utils/shareTexts'

async function clipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

export function MorePage({ notify }: { notify: (msg: string) => void }) {
  const { exportJson, importJson, clearAll, catalog, state } = useCollection()
  const [importArea, setImportArea] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-4 pb-40 text-sm text-slate-800">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Compartilhar (troca rápido)</h2>
        <p className="mb-4 text-xs text-slate-600">
          Textos compatíveis com mensagens tipo WhatsApp. Ajuste à vontade depois de colar.
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

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Backup offline</h2>
        <p className="mb-3 text-xs text-slate-600">
          O progresso só fica neste navegador. Exporte com frequência — o arquivo contém{' '}
          <code className="text-slate-800">&quot;version&quot;: 3</code> alinhado à ordem física (Panini&nbsp;00, FWC inicial, seleções, FWC final).
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
          Remove todas as marcações apenas neste aparelho. Faça backup antes de continuar.
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
