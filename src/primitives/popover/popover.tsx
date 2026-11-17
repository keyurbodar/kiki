import { Popover as BasePopover } from "@base-ui/react/popover";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const Popover = BasePopover.Root;

export type PopoverProps = ComponentProps<typeof BasePopover.Root>;

export type PopoverTriggerProps = ComponentProps<typeof BasePopover.Trigger>;

export function PopoverTrigger(props: PopoverTriggerProps) {
  return <BasePopover.Trigger data-slot="popover-trigger" {...props} />;
}

export const popoverContentVariants = cva("", {
  variants: { variant: { default: "", unstyled: "" } },
  defaultVariants: { variant: "default" },
});

export type PopoverContentProps = Omit<
  ComponentProps<typeof BasePopover.Popup>,
  "className"
> &
  Pick<
    ComponentProps<typeof BasePopover.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  > &
  VariantProps<typeof popoverContentVariants> & { className?: string };

export function PopoverContent({
  side,
  align,
  sideOffset,
  alignOffset,
  variant,
  className,
  ...props
}: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BasePopover.Popup
          data-slot="popover-content"
          className={popoverContentVariants({ variant, className })}
          {...props}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
