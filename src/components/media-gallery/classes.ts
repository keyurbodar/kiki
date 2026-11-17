/*
 * Capy's class strings for the gallery, kept in one place so every tile, card
 * and frame reads the same frame. Names in brackets are Capy's bundle symbols.
 */

/** Every gallery frame: rounded card, hairline border, secondary bed. (EK) */
export const mediaFrameClass =
  "relative overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-secondary";

/** A frame that opens the lightbox. (q$n) */
export const mediaZoomClass = `${mediaFrameClass} cursor-zoom-in focus-visible:outline-ring-inset`;

export type MediaLayout = "pair" | "hero" | "stack" | "grid" | "fit";

/** Justified-layout tile classes. (Lon) */
export const mediaLayoutClass: Record<MediaLayout, string> = {
  pair: "aspect-[4/3] min-w-0 flex-1",
  hero: "min-w-0 flex-[1.5]",
  stack: "min-h-0 w-full flex-1",
  grid: "aspect-video min-w-0 flex-1",
  fit: "min-w-0",
};

/** Image cover inside a frame, cropped from the top. (Bon) */
export const mediaCoverClass = "size-full object-cover object-top";

/** The file, audio and pending card body. (tH) */
export const fileCardClass =
  "group flex h-12 w-60 max-w-full cursor-pointer items-center gap-2 rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-button py-1.5 pr-2 pl-1.5 text-left shadow-plate transition-colors duration-fast hover:bg-button-hover focus-visible:outline-ring-inset";

/** The 9-unit thumbnail well every card leads with. (nH) */
export const thumbClass =
  "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-(--radius) bg-secondary text-icon-muted";

/** The audio player card. (n1n) */
export const audioCardClass =
  "flex w-80 max-w-full flex-col rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-button shadow-plate";

/** The measured frame `ImageUnavailable` draws in. (RJt) */
export const imageUnavailableFrameClass =
  "flex aspect-video w-(--media-box-w) max-w-full items-center justify-center rounded-(--radius-card)";

/** One-line card titles that fade out instead of clipping. */
export const cardTitleClass =
  "mask-fade-r overflow-hidden text-sm font-medium whitespace-nowrap [--mask-fade-ramp:calc(var(--spacing)*2)]";

/** The secondary line under a card title. */
export const cardDetailClass = "truncate text-2xs text-muted-foreground-2";

/** The download/open glyph that only shows on hover. (dat) */
export const cardTrailingIconClass =
  "size-(--icon-sm) shrink-0 text-icon-muted opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100";
