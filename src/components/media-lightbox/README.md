# media-lightbox

Capy's `shared/media-lightbox` (WP B12): the full-screen media preview.

- `MediaLightbox` takes `entries` (`{ key, label, kind }`), `index`, `onIndexChange`, `onClose` and the renderers `renderMedia`, `renderThumbnail` and optional `renderActions`. It renders the media scrim, the `1 / N` counter, the `lightbox-actions` toolbar (your actions, then "Close preview"), previous/next buttons, the virtualised `lightbox-strip` and, for images, pan-zoom with `PanZoomControls` (wheel, pinch, drag, double-click/double-tap, swipe, `+ - 0 1 2` keys). Arrow keys wrap, Escape closes.
- `MediaLightboxActions` is the usual `renderActions`: Copy image (or Copy frame through `MediaLightboxFrameContext`) and Download, bound to mod+C / mod+S while focus is in the preview.
- `media-actions.ts` holds `mediaActions`, `fetchBlob`, `copyImageBlob`, `saveBlob` and `useMediaShortcut`, shared with `media-context-menu`.
- `lightboxImageClassName`, `lightboxVideoClassName`, `lightboxThumbnailClassName` and `LightboxVideoThumbnail` are Capy's media and thumbnail styles.

## Annotation hooks

The annotation unit plugs in the way Capy's media comment layer does, by wrapping the lightbox props:

- `renderMedia`: wrap the media in the per-item annotation layer. It sits inside the pan-zoom transform, so pins and regions scale with the image.
- `renderThumbnail`, `renderActions`: add comment badges and the Annotate/Done button.
- `aside`: the comments panel; `overlay`: anything layered over the whole lightbox.
- `onEscape`: return `true` to leave annotate mode instead of closing.
