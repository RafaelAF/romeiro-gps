<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RomeiroGPS

PWA mobile-first de turismo e caravanas em tempo real em Aparecida - SP. Stack: Next.js (App Router), Tailwind v4, Leaflet, Lucide Icons, Supabase ou Firebase (realtime — escolha ainda em aberto; isolar o acesso em módulo próprio para troca fácil).

## Estado atual (importante)

A criação/entrada em caravanas/grupos está **desativada por enquanto** (para não consumir banco de dados). O app funciona como **mapa pessoal com líder identificado por celular** e compartilhamento **estático por link** (sem banco, sem tempo real entre aparelhos).

- **Raiz `/`**: ao abrir, o usuário identifica-se com o celular (tela `components/TelaIdentificacao.tsx`, com disclaimer: dados usados apenas para identificação/geração de link). Identificado = líder; **não há toggle de líder**.
- **Líder**: marca o ponto de encontro com long-press; o drawer tem botão **Compartilhar** que gera um link `/ver?lider=<id>&lat=..&lng=..&rotulo=..` (ponto fixo embutido na URL — link estático).
- **Rota `/ver`**: visão do seguidor com **apenas o ponto de encontro** (sem POIs, sem localização própria). `app/ver/page.tsx` lê `searchParams` (Promise) e renderiza `components/VerApp.tsx` → `components/VerMapa.tsx` (Leaflet, `ssr: false` via Client Component).
- `lider` no link é um hash do telefone (`idLider`, `lib/pontoEncontro.ts`) — o telefone **não é exibido** ao seguidor.
- O ponto de encontro é local ao dispositivo (`lib/pontoEncontro.ts`, `localStorage` + `BroadcastChannel` para sincronizar abas do mesmo navegador).

- O código de caravanas (tipos, `lib/realtime.ts`) permanece no repositório para reativar no futuro, mas **não é importado** por nenhum componente ativo.

## Arquivos obrigatórios (não renomear nem fundir)

- `components/MapView.tsx` — mapa Leaflet do líder: camadas de POIs + marcador da própria posição + long-press para ponto de encontro (líder sempre ativo; sem prop de modo líder).
- `lib/useCaravanaTracking.ts` — hook customizado de geolocalização (usado para a posição própria; o envio em tempo real fica inativo).
- `components/CaravanaDrawer.tsx` — painel inferior: status GPS, identificação do líder, ponto de encontro, botão compartilhar e telefones úteis.

Mapa centrado em Aparecida - SP (~[-45.236, -22.845]). Leaflet no Next.js exige importação dinâmica com `ssr: false` (Leaflet acessa `window`). Em Next.js 16 o `ssr: false` deve ficar num Client Component — feito via `components/CaravanaAppLoader.tsx` (e `components/VerApp.tsx` para a rota `/ver`).

## Realtime

- `lib/realtime.ts` expõe a interface `RealtimeClient` + factory `getRealtimeClient()` (implementação local com `LocalRealtimeClient`). Atualmente sem uso — mantenha o contrato para reativar caravanas com Supabase/Firebase.
- `lib/pontoEncontro.ts`: `lerPontoEncontro`, `salvarPontoEncontro`, `assinarPontoEncontro`, `lerTelefone`/`salvarTelefone`, `idLider`, `gerarLinkCompartilhamento`. Mutação local também notifica assinantes na mesma aba (a aba não recebe o próprio BroadcastChannel).

## Requisitos não-negociáveis

1. **GPS throttling:** `navigator.geolocation.watchPosition` com filtro de distância (>10 m) e/ou debounce de 15–30 s. Proibido envio contínuo a cada segundo.
2. **Payload mínimo:** `{ "id": string, "lat": number, "lng": number, "ts": number }`.
3. **TTL/expiração:** rotina no banco para inativar caravana e expurgar coordenadas após `expiraEm` (relevante ao reativar grupos).
4. **UX mobile-first:** botões grandes, legível sob luz solar. Testar com viewport de celular.

## Dados e tipos

- POIs: arquivo GeoJSON local; filtros por `properties.categoria` (`turismo_religioso`, `saude`, `apoio_romeiro`, `utilidade_publica`, `transporte`, `lazer`, `turismo`, `praca_publica`).
- Tipos `Membro` e `Caravana` (com `pontoEncontro?`, `expiraEm`, `membros[]`) em `lib/types.ts`.

## Convenções

- Sem comentários no código salvo quando solicitado.
- Verificação: `npm run lint` e `npx tsc --noEmit` antes de concluir. (Npm via `npm.cmd` — o shim `npm.ps1` é bloqueado pelo PowerShell neste ambiente.)
