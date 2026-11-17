# Wallpapers

Capy ships no built-in wallpapers. Its `wallpapers` chunk is only the user-upload API (`/me/wallpapers`: list, upload, image, background, remove; see `src/data`), and the dashboard background is whatever image the user uploads, drawn through Paper Shaders' `ImageDithering` with the parameters in `WALLPAPER_DITHER` (`src/tokens/effects.ts`).

This directory stays empty until Capy ships a stock wallpaper.
