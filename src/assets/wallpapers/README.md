# Wallpapers

Capy's Explore themes carry wallpapers, and this directory holds them byte for
byte. A theme listing binds one through `theme.wallpaper`
(`{name, digest, contentType, size}`), and Capy serves the image itself from
`GET /explore/themes/:slug/wallpaper` — the endpoint `explorePublic` declares
and `data/mocks/explorePublic` answers here.

## Provenance

Downloaded from Capy's public Explore API on 2026-11-18:

```sh
curl https://api.capy.ai/app/explore/listings?kind=theme          # 17 listings
curl https://api.capy.ai/app/explore/themes/<slug>/wallpaper      # the image
```

Every file's sha256 equals the `digest` its listing declares, so the bytes are
Capy's own rather than a re-encode. `index.ts` carries those digests beside the
imports; `index.test.ts` re-checks them.

Fourteen of the seventeen listings ship a wallpaper. `classic`, `dracula-nh6jx9`
and `dioptra-y1m70z` do not, and their cards draw the palette instead.

## Naming

Files are named by the listing slug — `holy-night.webp`, `akane.webp` — which is
what the wallpaper endpoint is keyed on. The images keep Capy's own format: the
four catalogue themes ship WebP, the user-published listings ship whatever they
uploaded (JPEG or PNG).

## Where it renders

- `/explore` theme cards and the listing detail stage, through
  `useThemeWallpaper` → `explorePublic.wallpaperImage`.
- The dashboard background, when a person adds a theme that has a wallpaper:
  adding it puts that wallpaper behind the composer, the way Capy's add flow
  downloads the image and sets it as the background.
