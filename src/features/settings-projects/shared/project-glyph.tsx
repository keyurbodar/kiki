import { Glyph } from "./glyphs";

const namedIcons = new Set([
  "home",
  "compass",
  "globe",
  "task",
  "console",
  "files",
  "folder",
  "code",
  "puzzle",
  "star",
  "key",
  "bell",
  "people",
  "shield",
  "chart",
  "clock",
  "pin",
  "search",
]);

/**
 * A project's icon: its logo, its emoji, or Capy's project glyph for the
 * named icons (the sprite doesn't carry the named project icons yet).
 */
export function ProjectGlyph({
  icon,
  logoUrl,
  className,
}: {
  readonly icon: string;
  readonly logoUrl?: string | null;
  readonly className?: string;
}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={className} />;
  }
  if (!namedIcons.has(icon)) {
    return (
      <span aria-hidden="true" className="leading-none">
        {icon}
      </span>
    );
  }
  return <Glyph name="inbox" className={className} />;
}
