# Server Provider Reference

Manual configs from public provider docs (June 2026).  
Source list: [`streamingapilinks.md`](streamingapilinks.md)

> **Policy:** Safe metadata/subtitle/segment providers ship **enabled**. Unofficial embed/stream domains are documented for reference but stay **`enabled: false`** until you confirm distribution rights, ToS permission, and lawful licensing.

---

## 1. Rules

- Keep all API keys on the server — never in browser JS, mobile bundles, or public repos.
- Each provider declares `capability`, `baseUrl`, `auth`, `cacheTtlSeconds`, and `legalStatus`.
- Embed/stream providers: enable only for content you own, are licensed to distribute, or via official APIs with documented rights.
- Unknown embed sites stay disabled by default.

---

## 2. Environment

```env
TMDB_ACCESS_TOKEN=              # TMDB metadata (required for catalog)

# Tier 1 — safe support providers
ANILIST_ACCESS_TOKEN=           # Optional; required for authenticated AniList user actions
WYZIE_API_KEY=                  # Required for Wyzie subtitle API
THEINTRODB_API_KEY=             # Optional; only for POST /submit (GET /media needs no key)
```

---

## 3. Provider Shape

```ts
export type ProviderCapability =
  | "metadata"
  | "subtitles"
  | "media-segments"
  | "licensed-stream"
  | "embed-iframe"   // third-party iframe players — manual-review by default
  | "blocked";

export type ServerProvider = {
  id: string;
  name: string;
  enabled: boolean;
  capability: ProviderCapability;
  baseUrl?: string;
  auth?: "none" | "bearer" | "query-key" | "server-only";
  cacheTtlSeconds: number;
  legalStatus: "allowed" | "allowed-if-licensed" | "manual-review" | "blocked";
  // Embed-only fields:
  movieTemplate?: string;
  tvTemplate?: string;
  animeTemplate?: string;
  idTypes?: ("tmdb" | "imdb" | "anilist" | "mal")[];
  notes: string;
};
```

```ts
export function getEnabledProvider(id: string, providers: ServerProvider[]) {
  const p = providers.find((item) => item.id === id);
  if (!p?.enabled) throw new Error("Provider is disabled or unavailable.");
  if (p.legalStatus === "blocked" || p.capability === "blocked") {
    throw new Error("Provider is blocked by policy.");
  }
  return p;
}
```

---

## 4. ID Legend (embed templates)

| Token | Source | Example |
|-------|--------|---------|
| `{tmdbId}` | TMDB numeric | `550` |
| `{imdbId}` | IMDb with `tt` | `tt0137523` |
| `{anilistId}` | AniList media ID | `15125` |
| `{malId}` | MyAnimeList ID | `5` |
| `{season}` / `{episode}` | TV numbers | `1` |

---

## 5. Tier 1 — Allowed Support Providers (`enabled: true`)

### 5.1 AniList — anime/manga metadata

```ts
{
  id: "anilist",
  name: "AniList",
  enabled: true,
  capability: "metadata",
  baseUrl: "https://graphql.anilist.co",
  auth: "bearer",
  cacheTtlSeconds: 21600,
  legalStatus: "allowed",
  notes: "GraphQL POST. Token optional for public reads; required for user list sync."
}
```

- Route: `POST /api/providers/anilist` → forward `{ query, variables }` to `https://graphql.anilist.co`
- Docs: https://docs.anilist.co/

```graphql
query MediaSearch($search: String) {
  Media(search: $search, type: ANIME) {
    id
    title { romaji english native }
    format
    episodes
    status
    coverImage { large }
    externalLinks { site url siteId }
  }
}
```

### 5.2 Wyzie Subs — subtitles (lawful playback only)

```ts
{
  id: "wyzie-subs",
  name: "Wyzie Subs",
  enabled: true,
  capability: "subtitles",
  baseUrl: "https://sub.wyzie.io",
  auth: "server-only",
  cacheTtlSeconds: 43200,
  legalStatus: "allowed-if-licensed",
  notes: "Subtitles for content you are legally allowed to play. Key stays server-side."
}
```

- Route: `GET /api/providers/wyzie/subtitles?id=tt3659388&language=en&format=srt`
- Server appends `&key=${WYZIE_API_KEY}`; client never receives the key.
- Docs: https://sub.wyzie.io/

```ts
type WyzieSubtitleRequest = {
  id: string;           // TMDB numeric or IMDb tt…
  season?: number;      // TV: required with episode
  episode?: number;
  language?: string;    // en,es,ja (comma-separated)
  format?: "srt" | "ass" | "vtt";
  hi?: boolean;
  encoding?: string;
  source?: string;
  origin?: string;      // WEB, BLURAY, DVD
  refresh?: boolean;
};
```

### 5.3 TheIntroDB — intro/recap/credits segments

```ts
{
  id: "theintrodb",
  name: "TheIntroDB",
  enabled: true,
  capability: "media-segments",
  baseUrl: "https://api.theintrodb.org",
  auth: "optional-bearer",
  cacheTtlSeconds: 86400,
  legalStatus: "allowed-if-licensed",
  notes: "GET /media is public (accepted submissions only). Bearer key optional — only needed for POST /submit or to include your pending submissions in averages."
}
```

- Route: `GET /api/providers/theintrodb/segments?tmdbId=123&season=1&episode=1` (no API key required)
- Docs: https://theintrodb.org/

```ts
type MediaSegment = {
  type: "intro" | "recap" | "credits" | "preview";
  startSeconds: number;
  endSeconds: number;
  source: "theintrodb";
};
```

### 5.4 Owned / Licensed CDN (your content only)

```ts
{
  id: "owned-cdn",
  name: "Owned / Licensed CDN",
  enabled: true,
  capability: "licensed-stream",
  baseUrl: "https://cdn.example.com",
  auth: "server-only",
  cacheTtlSeconds: 600,
  legalStatus: "allowed",
  notes: "HLS/DASH/MP4 for content you own or are licensed to distribute."
}
```

```ts
type LicensedStream = {
  titleId: string;
  playbackUrl: string;
  type: "hls" | "dash" | "mp4";
  expiresAt: string;
  subtitles?: Array<{ language: string; url: string; format: "vtt" | "srt" }>;
  segments?: MediaSegment[];
};
```

---

## 6. Tier 2 — Embed Iframe Providers (`enabled: false` default)

Documented URL templates for server-switching UI. **Do not enable without manual review** (Section 9).

| ID | Provider | Movie | TV | Anime | IDs | Legal |
|----|----------|-------|-----|-------|-----|-------|
| `111movies` | 111movies.net | `/movie/{id}` | `/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `2embed` | 2embed.cc/.skin/.stream | `/embed/{id}` | `/embedtv/{id}?s={s}&e={e}` | — | TMDB, IMDB | manual-review |
| `autoembed` | player.autoembed.app | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `cinemaos` | cinemaos.tech | `/player/{tmdbId}` | `/player/{tmdbId}/{s}/{e}` | — | TMDB | manual-review |
| `cinesrc` | cinesrc.st | `/embed/movie/{tmdbId}` | `/embed/tv/{tmdbId}?s={s}&e={e}` | — | TMDB | manual-review |
| `cinezo` | player.cinezo.live | `/embed/movie/{tmdbId}` | `/embed/tv/...` | `/embed/anime/{anilistId}/{e}?dub=` | TMDB, AniList | manual-review |
| `mapple` | mapple.uk | `/watch/movie/{tmdbId}` | `/watch/tv/{tmdbId}-{s}-{e}` | — | TMDB | manual-review |
| `peachify` | peachify.top | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `primesrc` | primesrc.me | `/embed/movie?tmdb=` | `/embed/tv?tmdb=&season=&episode=` | — | TMDB, IMDB | manual-review |
| `smashystream` | player.smashy.stream | `/movie/{id}` | `/tv/{id}?s={s}&e={e}` | — | TMDB, IMDB | manual-review |
| `spencerdevs` | spencerdevs.xyz | `/movie/{tmdbId}` | `/tv/{tmdbId}/{s}/{e}` | `/anime/{anilistId}/{e}` | TMDB, AniList | manual-review |
| `superembed` | multiembed.mov | `?video_id={id}&tmdb=1` | `&s={s}&e={e}` | — | TMDB, IMDB | manual-review |
| `vidapi` | vidapi.xyz | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `videasy` | player.videasy.net | `/movie/{tmdbId}` | `/tv/{tmdbId}/{s}/{e}` | `/anime/{anilistId}/{e}` | TMDB, AniList | manual-review |
| `vidfast` | vidfast.pro (+mirrors) | `/movie/{id}` | `/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `vidflix` | vidflix.club | `/movie/{tmdbId}` | `/tv/{tmdbId}/{s}/{e}` | — | TMDB | manual-review |
| `vidify` | player.vidify.top | `/embed/movie/{tmdbId}` | `/embed/tv/...` | `/embed/anime/{anilistId}/{e}` | TMDB, AniList | manual-review |
| `vidlink` | vidlink.pro | `/movie/{tmdbId}` | `/tv/{tmdbId}/{s}/{e}` | `/anime/{malId}/{e}/sub` | TMDB, MAL | manual-review |
| `vidnest` | vidnest.fun | `/movie/{tmdbId}` | `/tv/...` | `/anime/{anilistId}/{e}/sub` | TMDB, AniList | manual-review |
| `vidplays` | vidplays.fun | `/embed/movie/{tmdbId}` | `/embed/tv/...` | — | TMDB | manual-review |
| `vidplus` | player.vidplus.to | `/embed/movie/{tmdbId}` | `/embed/tv/...` | `/embed/anime/{anilistId}/{e}` | TMDB, AniList | manual-review |
| `vidzen` | vidzen.fun | `/movie/{tmdbId}` | `/tv/{tmdbId}/{s}/{e}` | — | TMDB | manual-review |
| `vidzee` | player.vidzee.wtf | `/embed/movie/{tmdbId}` | `/embed/tv/...` | — | TMDB | manual-review |
| `vidsrc` | vidsrc.to (+mirrors) | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `vixsrc` | vixsrc.to | `/movie/{id}` | `/tv/{id}/{s}/{e}` | — | TMDB, IMDB | manual-review |
| `wfs` | embed.wfs.lol | `/embed/movie/{tmdbId}` | `/embed/tv/{tmdbId}/{s}/{e}` | TV path | TMDB | manual-review |

**Full URL prefix:** prepend `https://{domain}` from each provider's docs.

### Mirror groups

- **VidFast:** `vidfast.pro` · `.in` · `.io` · `.me` · `.net` · `.pm` · `.xyz`
- **VidSrc:** `vidsrc.to` · `.su` · `.vip` · `.rip` · `.wtf` · `vidsrcme.ru` · `vidsrc-me.ru` · `vidsrc-me.su` · `vsembed.ru`
- **2Embed:** `www.2embed.cc` · `www.2embed.skin` · `2embed.stream`

### JSON embed config example

```json
{
  "id": "vidfast",
  "name": "VidFast",
  "enabled": false,
  "capability": "embed-iframe",
  "legalStatus": "manual-review",
  "domains": ["vidfast.pro"],
  "idTypes": ["tmdb", "imdb"],
  "movieTemplate": "https://vidfast.pro/movie/{tmdbId}",
  "tvTemplate": "https://vidfast.pro/tv/{tmdbId}/{season}/{episode}",
  "animeTemplate": null,
  "defaultParams": { "autoPlay": "true" },
  "cacheTtlSeconds": 0,
  "docs": "https://vidfast.pro/"
}
```

### Not embed players (do not wire as iframe sources)

| Link | Capability | Notes |
|------|------------|-------|
| docs.anilist.co | metadata | GraphQL catalog |
| sub.wyzie.io | subtitles | See §5.2 |
| theintrodb.org | media-segments | See §5.3 |
| docs.undi.rest | — | sudo-flix self-hosted app |
| api.xyra.stream | blocked | HLS stream API; needs key |
| goatapi.*.workers.dev | blocked | REST stream links; not iframe |
| api.smashystream.top | blocked | 404; use player.smashy.stream |

### Unverified (no public docs — test before documenting)

`1embed.cc` · `thisiscinema.pages.dev` · `embed.icefy.top` · `web.nxsha.app` · `nontongo.win` · `streamvaultsrc.click` · `vidcore.net` · `vidjoy.pro` · `vidking.net` · `vidrock.ru` · `vidsync.xyz` · `vidup.to` · `vyla.mintlify.app` · `api.zxcstream.xyz` · `vidapi.ru`

---

## 7. Embed Provider Details (selected)

<details>
<summary><strong>vidfast</strong> — vidfast.pro</summary>

```
movie: https://vidfast.pro/movie/{id}
tv:    https://vidfast.pro/tv/{id}/{season}/{episode}
```
Params: `autoPlay` `startAt` `theme` `server` `sub` `nextButton` `autoNext`
</details>

<details>
<summary><strong>vidsrc</strong> — vidsrc.to + mirrors</summary>

```
movie:  https://vidsrc.to/embed/movie/{id}
tv:     https://vidsrc.to/embed/tv/{id}/{season}/{episode}
season: https://vidsrc.to/embed/tv/{id}/{season}
```
List API: `/vapi/movie/new` · `/vapi/episode/latest`
</details>

<details>
<summary><strong>peachify</strong> — peachify.top</summary>

```
movie: https://peachify.top/embed/movie/{id}
tv:    https://peachify.top/embed/tv/{id}/{season}/{episode}
```
Params: `server=iron|spider|wolf` `dub` `sub` `startAt` `autoNext`  
postMessage: `PLAYER_EVENT`, `MEDIA_DATA`
</details>

<details>
<summary><strong>vidlink</strong> — vidlink.pro</summary>

```
movie: https://vidlink.pro/movie/{tmdbId}
tv:    https://vidlink.pro/tv/{tmdbId}/{season}/{episode}
anime: https://vidlink.pro/anime/{malId}/{episode}/sub
```
postMessage: `PLAYER_EVENT`, `MEDIA_DATA`
</details>

<details>
<summary><strong>cinesrc</strong> — cinesrc.st</summary>

```
movie: https://cinesrc.st/embed/movie/{tmdbId}
tv:    https://cinesrc.st/embed/tv/{tmdbId}?s={season}&e={episode}
```
postMessage: `cinesrc:play` `cinesrc:timeupdate` `cinesrc:nextepisode`
</details>

<details>
<summary><strong>wfs</strong> — embed.wfs.lol</summary>

```
movie: https://embed.wfs.lol/embed/movie/{tmdbId}
tv:    https://embed.wfs.lol/embed/tv/{tmdbId}/{season}/{episode}
```
Params: `server=1|2|3` `audio=sub|dub`
</details>

<details>
<summary><strong>superembed</strong> — multiembed.mov</summary>

```
movie: https://multiembed.mov/?video_id={id}&tmdb=1
tv:    https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}
vip:   https://multiembed.mov/directstream.php?video_id={id}&tmdb=1
```
Add `&tmdb=1` for TMDB IDs; omit for IMDB `tt…`
</details>

<details>
<summary><strong>primesrc</strong> — primesrc.me (query-string IDs)</summary>

```
movie: https://primesrc.me/embed/movie?tmdb={tmdbId}
tv:    https://primesrc.me/embed/tv?tmdb={tmdbId}&season={s}&episode={e}
```
Params: `fallback` `serverOrder` `whitelistServers` `startAt`
</details>

---

## 8. Iframe Integration

```html
<iframe
  key="{serverId}-{tmdbId}-{season}-{episode}"
  src="{builtUrl}"
  class="w-full h-full border-0"
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
  allowfullscreen
  referrerpolicy="origin"
></iframe>
```

- **Server switch:** change React `key` → full iframe remount.
- **Continue watching:** postMessage from peachify, vidlink, vidnest, vixsrc, cinesrc, videasy.
- **CSP:** add embed hostnames to `frame-src` in `next.config.ts`.

---

## 9. Manual Review Checklist

Before setting any Tier 2 provider to `enabled: true`:

- [ ] Official API or written permission confirmed
- [ ] Does not bypass paywalls, DRM, or geo-blocks
- [ ] Terms allow server-side / iframe integration
- [ ] Content rights confirmed for target region
- [ ] API keys remain server-side
- [ ] Rate limits and caching configured
- [ ] Failures logged without exposing secrets

---

## 10. Recommended Starter Set (after review)

| Priority | ID | Why |
|----------|-----|-----|
| 1 | vidfast | TMDB+IMDB, rich params, 7 mirrors |
| 2 | vidsrc | TMDB+IMDB, season embed, list API |
| 3 | vidlink | TMDB + MAL anime + progress events |
| 4 | videasy | TMDB + AniList + overlay UI |
| 5 | peachify | TMDB+IMDB, server forcing, progress |
| 6 | wfs | TMDB, sub/dub, manga path |
| 7 | spencerdevs | TMDB + AniList, simple paths |

---

## 11. Folder Layout

```txt
app/SERVERS/
  README.md              ← this file
  streamingapilinks.md   ← raw link inventory
  providers.ts           ← ServerProvider[] registry
  embed/                 ← Tier 2 JSON configs (enabled: false)
    vidfast.json
    vidsrc.json
  routes/                ← optional BFF handlers
    anilist.ts
    wyzie-subs.ts
    theintrodb.ts
```
