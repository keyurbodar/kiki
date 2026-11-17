import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps } from "react";

export const PreviewCard = BasePreviewCard.Root;

export type PreviewCardProps = ComponentProps<typeof BasePreviewCard.Root>;

export type PreviewCardTriggerProps = ComponentProps<
  typeof BasePreviewCard.Trigger
>;

export function PreviewCardTrigger(props: PreviewCardTriggerProps) {
  return (
    <BasePreviewCard.Trigger data-slot="preview-card-trigger" {...props} />
  );
}

export type PreviewCardContentProps = ComponentProps<
  typeof BasePreviewCard.Popup
> &
  Pick<
    ComponentProps<typeof BasePreviewCard.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  >;

export function PreviewCardContent({
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: PreviewCardContentProps) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        data-slot="preview-card"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BasePreviewCard.Popup data-slot="preview-card-content" {...props} />
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
