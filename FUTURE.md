# Futuras melhorias — consumo de rede (sinal fraco / pouca internet)

Análise de uso de rede do RomeiroGPS com foco em usuários com sinal fraco. Medições do estado
atual (fluxos, payloads e simulações) e melhorias priorizadas para implementar futuramente.

## Medições atuais

- Carga inicial (shell JS/CSS/HTML): ~270 KB gzip.
- Tiles OSM: ~12 KB (z16), ~18 KB (z13), ~31 KB (z10); **sem cache** — `public/sw.js` ignora
  cross-origin (`if (url.origin !== self.location.origin) return;`).
- POST posição do seguidor: ~170 B a cada 15 s.
- POST presença do líder: ~200 B (0 POIs) a ~5,7 KB (50 POIs), reenviado a cada 15 s mesmo
  sem mudanças.
- SSE: heartbeat 8 B/25 s; snapshot completo da sessão a cada reconexão (backoff 1s·2ⁿ, máx 30 s).
- OSRM (traçar rota): ~0,7–2 KB por chamada, sob demanda.
- `focarGrupo` com membro distante desce o zoom para ~z8-9 e pode baixar 0,5–1,5 MB por ciclo.

## Simulações

- Seguidor parado 30 min compartilhando: ~210 KB (sinal bom) a ~320 KB (fraco).
- Seguidor andando 1 h compartilhando (fraco): ~2,7–4,3 MB down — dominado por tiles.
- Líder 2 h com 20 seguidores ativos (fraco): ~356 KB up / ~2,7 MB down.
- Primeiro acesso (5 min, sem compartilhar): ~380–400 KB.

## Melhorias priorizadas

1. **Cache-first de tiles no SW** — interceptar `*.tile.openstreetmap.org` com cache LRU
   (~1500 tiles ≈ 25 MB). Elimina o re-download e os tiles cinza; maior impacto em sinal fraco.
2. **POIs por diff** — o líder só envia `pois` quando a lista muda; presença cai de ~740 B para
   ~200 B/15 s.
3. **Retry adaptativo de POST** — em falha, reenviar a última posição em ~30 s para a posição
   não congelar.
4. **Limitar `focarGrupo`** — não descer abaixo de ~z11 ("alguém está muito longe") para evitar
   downloads de MBs.
5. **Modo economia de dados** — desligar auto-follow/recenter; pré-cache da área de Aparecida
   (z13–16) no SW para uso offline/first paint rápido.
6. **Remover `@vercel/analytics`** — um domínio a menos em sinal fraco (opcional).

## SEO e indexação (sugestões)

Melhorias para o app ser encontrado no Google/Bing e aparecer com rich snippets. O FUTURE.md foca
em rede; daqui, itens 1 (cache-first de tiles) e 5 (pré-cache) também melhoram Core Web Vitals
(LCP/INP), que é fator de ranking.

Estado atual:
- Home é 100% client-render (`CaravanaAppLoader` com `ssr: false`) — HTML servido quase sem texto;
  os POIs ficam em GeoJSON local e nunca são indexados.
- Só 2 URLs indexáveis: `/` (vazia para crawler) e `/politica-privacidade`.
- Sem `sitemap.xml`, `robots.txt`, `opengraph-image` nem dados estruturados (JSON-LD).
- `/ver` aceita `lat/lng` na URL sem `noindex` — risco de URLs efêmeras indexadas.
- Metadados genéricos, sem palavras-chave locais (Santuário Nacional, Caminho da Fé, caravana).

Melhorias priorizadas:

1. **SSR/SSG da lista de POIs** — renderizar POIs (nome + categoria + cidade) como HTML real na
   home e hidratar o mapa Leaflet depois (`ssr: false`, padrão já usado). Maior ganho de indexação.
2. **Páginas por categoria de POI** — `/pontos-de-interesse` e `/categorias/[slug]` com JSON-LD
   `Place`/`TouristAttraction`; captura buscas como "onde fica a basílica de Aparecida".
3. **Metadados ricos** — titles/descriptions por página com keywords locais; `opengraph-image`
   dinâmico + `twitter:card` (o link preview atual no WhatsApp é genérico); `canonical` na home.
4. **`noindex` em `/ver`** — via `robots.metadata` no App Router; conteúdo é efêmero (48 h) e
   muda de URL a cada ponto.
5. **`sitemap.ts` + `robots.ts`** — listar `/`, `/politica-privacidade` e páginas de POI.
6. **FAQ/FAQPage (long-tail)** — bloco de conteúdo SSR (ex.: "Como chegar a Aparecida de ônibus?",
   "Como funciona a caravana?") com JSON-LD `FAQPage`.
7. **Consistência da privacidade** — seção 6 diz "24 horas", mas o app usa 48 h
   (`VALIDADE_LINK_MS`); página é a única com texto indexável hoje, manter coerente.

## Escalabilidade (tempo real)

Problemas identificados ao crescer / ir para produção:

1. **Sessões em memória no servidor** — `lib/sessoes.ts` usa `Map` em processo; em serverless
   (Vercel) cada instância tem memória própria, então o SSE do seguidor pode cair numa instância
   e o POST do líder em outra → tempo real quebra com 2+ funções ou cold start. SSE longa também
   custa em serverless. Migrar o realtime para Supabase/Firebase (contrato `lib/realtime.ts` já
   previsto) ou serviço de streaming/presença dedicado.
2. **Fan-out O(n) por posição** — cada POST é re-transmitido para todas as conexões SSE; a
   presença do líder com POIs multiplica: 50 POIs (~5,7 KB) × 100 seguidores ≈ 570 KB a cada
   15 s. Bandwidth cresce linearmente com seguidores (atenuado pelo diff de POIs acima).
3. **Reconexão reenvia snapshot completo** — cada queda de sinal repete a lista de todos os
   membros; com muitos membros multiplica o tráfego.
4. **TTL/expurgo** — membros offline ficam até 15 min em memória; hoje adequado, mas com
   banco (Supabase/Firebase) usar o `expiraEm` da caravana para inativar e expurgar.