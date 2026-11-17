import {
  createFileTreeIconResolver,
  getBuiltInSpriteSheet,
} from "@pierre/trees";
import { cx } from "class-variance-authority";
import { useEffect } from "react";

const iconSet = "complete";
const spriteId = "capy-file-icon-sprite";
const resolver = createFileTreeIconResolver(iconSet);

const ensureSprite = () => {
  const existing = document.getElementById(spriteId);
  if (existing?.dataset.iconSet === iconSet) return;
  const host = existing ?? document.createElement("div");
  host.id = spriteId;
  host.dataset.iconSet = iconSet;
  host.style.display = "none";
  host.innerHTML = getBuiltInSpriteSheet(iconSet);
  if (existing === null) document.body.append(host);
};

export type FileTypeIconProps = { name: string; className?: string };

/**
 * The file-type glyph Capy draws from @pierre/trees' complete set. The tinted
 * per-type palette isn't in src/tokens yet, so every type stays icon-muted.
 */
export function FileTypeIcon({ name, className }: FileTypeIconProps) {
  useEffect(ensureSprite, []);
  const icon = resolver.resolveIcon("file-tree-icon-file", name);
  return (
    <svg
      aria-hidden
      data-slot="file-icon"
      viewBox={icon.viewBox ?? "0 0 16 16"}
      className={cx("size-4 shrink-0 text-icon-muted", className)}
    >
      <use href={`#${icon.name}`} />
    </svg>
  );
}
