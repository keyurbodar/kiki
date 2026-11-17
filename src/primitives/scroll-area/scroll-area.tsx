import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode, Ref } from "react";

export type ScrollAreaProps = Omit<
  ComponentProps<typeof BaseScrollArea.Root>,
  "className" | "children"
> & {
  className?: string;
  viewportClassName?: string;
  fadeY?: boolean;
  retainScroll?: boolean;
  scrollRestorationId?: string;
  onViewport?: Ref<HTMLDivElement>;
  children?: ReactNode;
};

export function ScrollArea({
  className,
  viewportClassName,
  fadeY = false,
  retainScroll = false,
  scrollRestorationId,
  onViewport,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root
      data-slot="scroll-area"
      data-scroll-restoration-ignore={retainScroll ? "" : undefined}
      className={cx("relative min-h-0", className)}
      {...props}
    >
      <ScrollAreaViewport
        ref={onViewport}
        data-scroll-restoration-id={scrollRestorationId}
        className={viewportClassName}
      >
        {children}
      </ScrollAreaViewport>
      {fadeY && <div aria-hidden className="scroll-fade-cap-t" />}
      {fadeY && <div aria-hidden className="scroll-fade-cap-b" />}
      <ScrollAreaScrollbar>
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
    </BaseScrollArea.Root>
  );
}

export type ScrollAreaViewportProps = Omit<
  ComponentProps<typeof BaseScrollArea.Viewport>,
  "className"
> & { className?: string };

export function ScrollAreaViewport({
  className,
  ...props
}: ScrollAreaViewportProps) {
  return (
    <BaseScrollArea.Viewport
      data-slot="scroll-area-viewport"
      className={cx(
        "size-full overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export type ScrollAreaScrollbarProps = Omit<
  ComponentProps<typeof BaseScrollArea.Scrollbar>,
  "className"
> & { className?: string };

export function ScrollAreaScrollbar({
  className,
  orientation = "vertical",
  style,
  ...props
}: ScrollAreaScrollbarProps) {
  return (
    <BaseScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cx(
        "absolute inset-y-0 z-(--z-top-bar) flex w-1.5 justify-center opacity-0 transition-opacity duration-fast",
        "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        className,
      )}
      style={{ insetInlineEnd: "var(--scroll-area-inset, 0)", ...style }}
      {...props}
    />
  );
}

export type ScrollAreaThumbProps = Omit<
  ComponentProps<typeof BaseScrollArea.Thumb>,
  "className"
> & { className?: string };

export function ScrollAreaThumb({ className, ...props }: ScrollAreaThumbProps) {
  return (
    <BaseScrollArea.Thumb
      data-slot="scroll-area-thumb"
      className={cx("w-full rounded-full bg-muted-foreground-3/50", className)}
      {...props}
    />
  );
}
