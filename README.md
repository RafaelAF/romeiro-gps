# RomeiroGPS

PWA mobile-first de turismo e caravanas em tempo real em **Aparecida - SP**. Mapa interativo com pontos de interesse, rotas e compartilhamento de ponto de encontro por link — feito para uso sob luz solar, com botões grandes.

## Funcionalidades

- **Mapa do romeiro (líder)** com POIs de turismo religioso, saúde, apoio ao romeiro, utilidade pública, transporte, lazer, turismo e praças públicas (GeoJSON local, `lib/pois.ts`).
- **Identificação por celular**: ao abrir o app, o usuário se identifica com o telefone (`components/TelaIdentificacao.tsx`) e vira o líder — sem toggle.
- **Ponto de encontro**: o líder marca o local com long-press no mapa e gera um link de compartilhamento.
- **Compartilhamento estático por link**: `/ver?lider=<id>&lat=..&lng=..&rotulo=..&exp=<ms>` — sem banco de dados. O link é temporário (48 h) e o telefone do líder nunca é exposto ao seguidor.
- **Visão do seguidor** (`/ver`): apenas o ponto de encontro, com opção de ver a própria localização no mapa (permissão de GPS retentável).
- **POIs dinâmicos e rotas**: painel de rotas e trajetos para o seguidor, com confirmação ao excluir.
- **Tutorial interativo** destacando as funcionalidades principais.
- **Sincronização entre abas** do mesmo navegador via `BroadcastChannel` (`lib/pontoEncontro.ts`).

> **Nota sobre estado atual**: a criação/entrada em caravanas e o tempo real entre aparelhos estão **desativados** para não consumir banco de dados. O código de caravanas (`lib/realtime.ts`, `lib/types.ts`) permanece no repositório pronto para reativar com Supabase ou Firebase.

## Tecnologias

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4**
- **Leaflet** + **react-leaflet** (mapa)
- **Lucide Icons**
- **TypeScript**

## Começando

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador (de preferência em viewport de celular).

Scripts disponíveis:

| Comando        | Ação                          |
| -------------- | ----------------------------- |
| `npm run dev`  | Servidor de desenvolvimento   |
| `npm run build`| Build de produção             |
| `npm run start`| Serve o build de produção     |
| `npm run lint` | Lint (ESLint)                 |

## Estrutura

```
app/                 Rotas (/, /ver, /politica-privacidade)
components/          Mapa, drawer, telas de identificação e tutorial
lib/                 POIs, rotas, ponto de encontro, realtime, tipos
```

Arquivos-chave:

- `components/MapView.tsx` — mapa Leaflet do líder (POIs + posição própria + long-press).
- `components/CaravanaDrawer.tsx` — painel inferior com status GPS, ponto de encontro, compartilhar e telefones úteis.
- `lib/useCaravanaTracking.ts` — hook de geolocalização (com GPS throttling: filtro >10 m e debounce).
- `lib/pontoEncontro.ts` — lógica do ponto de encontro local + geração de link.
- `lib/rotas.ts`, `lib/pois.ts` — rotas e pontos de interesse.

## Política de privacidade

O app tem página dedicada em `/politica-privacidade`. Os dados do telefone são usados apenas para identificação e geração do link — o telefone do líder nunca é exibido ao seguidor.

## Roadmap

- Reativar caravanas/grupos com Supabase ou Firebase Realtime.
- TTL/expiração no banco para inativar caravanas e expurgar coordenadas após `expiraEm`.

---

Desenvolvido para os devotos e caravanas que visitam Aparecida - SP.