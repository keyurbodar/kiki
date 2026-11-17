import { Icon, type IconProps } from "@/primitives/icon";

export type GlyphProps = Omit<IconProps, "name">;

export const DownloadGlyph = (props: GlyphProps) => (
  <Icon name="arrow-inbox" {...props} />
);

export const OpenExternalGlyph = (props: GlyphProps) => (
  <Icon name="square-arrow-top-right" {...props} />
);

export const DotsHorizontalGlyph = (props: GlyphProps) => (
  <Icon name="dot-grid-1x3-horizontal" {...props} />
);

export const LinkGlyph = (props: GlyphProps) => (
  <Icon name="chain-link-1" {...props} />
);

export const ChevronDownSmallGlyph = (props: GlyphProps) => (
  <Icon name="chevron-down-small" {...props} />
);

export const ArrowLeftGlyph = (props: GlyphProps) => (
  <Icon name="arrow-left" {...props} />
);

export const ImagesGlyph = (props: GlyphProps) => (
  <Icon name="images-1" {...props} />
);
