# Public brand files

The brand files Capy serves from its public root, byte-identical to what capy.ai serves
(sha256 checked against the live files). They live under `public/brand/` so Vite copies
them to the build root untouched and the browser can fetch them before the app boots —
a favicon cannot be a Vite import.

| Path                     | Capy's URL           | Used by                                             |
| ------------------------ | -------------------- | --------------------------------------------------- |
| `favicon.svg`            | `/favicon.svg`       | `index.html` `<link rel="icon" type="image/svg+xml">` |
| `favicon.png`            | `/favicon.png`       | `index.html` `<link rel="icon" sizes="64x64">`        |
| `apple-touch-icon.png`   | `/apple-touch-icon.png` | `index.html` `<link rel="apple-touch-icon">`      |

The files are the same bytes as the copies the app imports from `@/assets/brand`
(`src/assets/brand/app/`), which stays the source for anything rendered by React:
`APP_ASSETS` carries the PWA icons (`/icons/app-192.png`, `/icons/app-512.png`,
`/icons/app-512-maskable.png`), the notification badges (`/badge/neutral-{light,dark}.svg`),
the Slack capy mark and `capy-sleeping.webp`. They only need a public copy once a web
manifest or a service worker asks for them at their Capy URL.

Not cloned yet, for anyone picking up the PWA work:

- `/api/manifest` — Capy's manifest is an API route that takes the current background
  colour as `?color=`, and its head script swaps the `theme-color` meta and the manifest
  href on every theme change. kiki has no server, so `index.html` ships Capy's static
  `<meta name="theme-color">` only.
- `/social/og-image.png` — Capy's 1200x630 share card. `index.html` points the Open Graph
  and Twitter tags at Capy's absolute URLs because kiki has no deployment origin; add a
  local copy here when it gets one.
