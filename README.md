## Álbum Copa 2026 (controle de figurinhas)

Aplicação web **mobile-first** para registrar o álbum oficial Panini FIFA World Cup 2026™ (**980 figurinhas** seguindo a ordem física: **Panini nº 00**, **FWC 1–8**, **48 seleções** com **1–20** por país na ordem dos **grupos A→L** (cabeças de série / potes conforme brochura), e **FWC 9–19** no encerramento), com **faltantes**, **repetidas** e **copiar texto** para trocas.

Os dados ficam apenas no navegador (localStorage); export/import em JSON garante backup.

Este projeto não é oficial da FIFA nem da Panini.

### Ordem física das 980 posições (IDs 1–980)

1. **00** selo oficial Panini.
2. **FWC 1 … FWC 8** antes das páginas de seleções.
3. **Seleções**, grupos A–L — em cada país, figurinhas sempre numeradas **1–20**. A lista de países e a ordem **dentro** de cada grupo vive em [`src/catalog/catalog.ts`](src/catalog/catalog.ts).
4. **FWC 9 … FWC 19** ao fechar o livro.

O canto **`#`** em cada figurinha é o **mesmo número** aceito pela colagem de listas (**1–980**). Nos times, aparece também o número impresso dentro da coleção (**1–20**) como destaque grande.

### Como rodar localmente

Requisitos: **Node.js 20 LTS ou superior**.

```bash
npm install
npm run dev
```

O terminal imprime primeiro o **caminho absoluto** da pasta onde o servidor lê os ficheiros: no Cursor deve abrir **essa mesma pasta** com **Ficheiro → Abrir Pasta…**. Se mantiver dois clones (por exemplo cópia no Windows e `~/github/album-copa-2026` no WSL) sem `git pull`/sincronizar, vai parecer que o código «nunca muda» — o navegador servia outro árvore.

Depois disso aparece algo como **`http://localhost:5173`**. Corra `npm run dev` na raiz do clone onde edita.


Gerar apenas o arquivo JSON público (opcional, espelha o TS):

```bash
npm run generate-catalog
```

### Build para produção

```bash
npm run build          # sai em ./dist
npm run preview        # testa ./dist locamente
```

O `vite.config.ts` usa **base `./` relativa**, adequada ao GitHub Pages.

### Deploy no GitHub Pages

1. Envie esta pasta inteira como repositório com `.github/workflows/deploy.yml`.
2. **Settings ▸ Pages ▸ Source ▸ GitHub Actions**.
3. **Settings ▸ Actions ▸ Workflow permissions ▸ Read & write**.
4. Push para `main`. Artefato: pasta **`dist/`**.

Opcional CI: definir **`VITE_BASE_PATH`** caso queira sobrepor a base durante o workflow.

### Ajustes no catálogo

- Edite **`TEAMS_ORDER`** (e opcionalmente `metalizada`) em [`src/catalog/catalog.ts`](src/catalog/catalog.ts).
- Rode `npm run generate-catalog` se quiser alinhar [`public/album/catalog.json`](public/album/catalog.json) — o aplicativo usa o código TypeScript compilado como fonte durante o uso.

### Backup (`version`: 3)

Exports JSON carregam `"version": 3`. Imports de layouts antigos (ordem pré-FWC/00) são recusados de propósito: re-marque a coleção e gere novo backup antes de sincronizar outro lugar.

### PWA instalável no celular

No Chrome/Android ou Safari/iOS (“Adicionar à Tela de Início”), há modo standalone graças a `vite-plugin-pwa`; o primeiro acesso precisa baixar o bundle inicial.

### Direitos Autorais

Marcas Copa do Mundo FIFA™, figurinhas Panini™ e elementos licenciados pertencem aos respectivos proprietários. Este código é um utilitário comunitário e não distribui conteúdo Panini oficial.
