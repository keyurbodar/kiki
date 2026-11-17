import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps } from "react";

export type ScrollAreaProps = ComponentProps<typeof BaseScrollArea.Root>;

export function ScrollArea(props: ScrollAreaProps) {
  return <BaseScrollArea.Root data-slot="scroll-area" {...props} />;
}

export type ScrollAreaViewportProps = ComponentProps<
  typeof BaseScrollArea.Viewport
>;

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  return (
    <BaseScrollArea.Viewport data-slot="scroll-area-viewport" {...props} />
  );
}

export type ScrollAreaScrollbarProps = ComponentProps<
  typeof BaseScrollArea.Scrollbar
>;

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  return (
    <BaseScrollArea.Scrollbar data-slot="scroll-area-scrollbar" {...props} />
  );
}

export type ScrollAreaThumbProps = ComponentProps<typeof BaseScrollArea.Thumb>;

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  return <BaseScrollArea.Thumb data-slot="scroll-area-thumb" {...props} />;
}
