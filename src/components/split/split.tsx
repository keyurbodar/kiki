import type { ComponentProps } from "react";

export type SplitProps = ComponentProps<"div">;

export function Split(props: SplitProps) {
  return <div {...props} />;
}

export type TileDividerProps = ComponentProps<"div">;

export function TileDivider(props: TileDividerProps) {
  return <div data-slot="tile-divider" {...props} />;
}

export type TileDropPreviewProps = ComponentProps<"div">;

export function TileDropPreview(props: TileDropPreviewProps) {
  return <div data-slot="tile-drop-preview" {...props} />;
}
