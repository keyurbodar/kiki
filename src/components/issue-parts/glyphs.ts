import { createElement as h, type SVGProps } from "react";
import { Icon } from "@/primitives/icon";

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

export const DotsHorizontal = (props: GlyphProps) =>
  h(Icon, { ...props, name: "dot-grid-1x3-horizontal", size: "sm" });

export const ArrowRotateClockwise = (props: GlyphProps) =>
  h(Icon, { ...props, name: "arrow-rotate-clockwise", size: "sm" });

export const CircleX = (props: GlyphProps) =>
  h(Icon, { ...props, name: "circle-x-outline", size: "sm" });

export const BellOff = (props: GlyphProps) =>
  h(Icon, { ...props, name: "bell-off", size: "sm" });

export const Bell = (props: GlyphProps) =>
  h(Icon, { ...props, name: "bell", size: "sm" });

export const ArrowShareRight = (props: GlyphProps) =>
  h(Icon, { ...props, name: "arrow-share-right", size: "sm" });

export const SquareBehindSquare = (props: GlyphProps) =>
  h(Icon, { ...props, name: "square-behind-square-2", size: "sm" });

export const ArrowCornerUpLeft = (props: GlyphProps) =>
  h(Icon, { ...props, name: "arrow-corner-up-left", size: "sm" });

export const CircleHalfFill = (props: GlyphProps) =>
  h(Icon, { ...props, name: "circle-half-fill", size: "sm" });

export const Flag = (props: GlyphProps) =>
  h(Icon, { ...props, name: "flag-1", size: "sm" });

export const Calendar = (props: GlyphProps) =>
  h(Icon, { ...props, name: "calendar-1", size: "sm" });

export const ChevronDownSmall = (props: GlyphProps) =>
  h(Icon, { ...props, name: "chevron-down-small", size: "sm" });

export const User = (props: GlyphProps) =>
  h(Icon, { ...props, name: "user", size: "sm" });

export const Tag = (props: GlyphProps) =>
  h(Icon, { ...props, name: "tag", size: "sm" });

export const UserEdit = (props: GlyphProps) =>
  h(Icon, { ...props, name: "user-edit", size: "sm" });

export const PullRequest = (props: GlyphProps) =>
  h(Icon, { ...props, name: "pull-request", size: "sm" });

export const Bubble = (props: GlyphProps) =>
  h(Icon, { ...props, name: "bubble-2", size: "sm" });

export const ChainLink = (props: GlyphProps) =>
  h(Icon, { ...props, name: "chain-link-1", size: "sm" });

export const PlusLarge = (props: GlyphProps) =>
  h(Icon, { ...props, name: "plus-large", size: "sm" });

export const CrossSmall = (props: GlyphProps) =>
  h(Icon, { ...props, name: "cross-small", size: "sm" });

export const EditSmall = (props: GlyphProps) =>
  h(Icon, { ...props, name: "edit-small-1", size: "sm" });

export const ChevronRightSmall = (props: GlyphProps) =>
  h(Icon, { ...props, name: "chevron-right-small", size: "sm" });

export const ChevronLeftSmall = (props: GlyphProps) =>
  h(Icon, { ...props, name: "chevron-left-small", size: "sm" });

export const ArrowUndoUp = (props: GlyphProps) =>
  h(Icon, { ...props, name: "arrow-undo-up", size: "sm" });

export const Lock = (props: GlyphProps) =>
  h(Icon, { ...props, name: "lock", size: "sm" });

export const Group = (props: GlyphProps) =>
  h(Icon, { ...props, name: "group-1", size: "sm" });

export const Globe = (props: GlyphProps) =>
  h(Icon, { ...props, name: "globe", size: "sm" });

export const CircleBan = (props: GlyphProps) =>
  h(Icon, { ...props, name: "circle-ban-sign", size: "sm" });

export const CrossMedium = (props: GlyphProps) =>
  h(Icon, { ...props, name: "cross-medium", size: "sm" });

export const Paperclip = (props: GlyphProps) =>
  h(Icon, { ...props, name: "paperclip-1", size: "sm" });

export const PlusMedium = (props: GlyphProps) =>
  h(Icon, { ...props, name: "plus-medium", size: "sm" });

export const Crown = (props: GlyphProps) =>
  h(Icon, { ...props, name: "crown", size: "sm" });

export const People = (props: GlyphProps) =>
  h(Icon, { ...props, name: "user-group", size: "sm" });

export const Threads = (props: GlyphProps) =>
  h(Icon, { ...props, name: "bubble-sparkle", size: "sm" });

export const Sparkle = (props: GlyphProps) =>
  h(Icon, { ...props, name: "sparkle-2", size: "sm" });

export const Files = (props: GlyphProps) =>
  h(Icon, { ...props, name: "files", size: "sm" });

export const ArrowUp = (props: GlyphProps) =>
  h(Icon, { ...props, name: "arrow-up", size: "sm" });

export const Microphone = (props: GlyphProps) =>
  h(Icon, { ...props, name: "microphone-outline", size: "sm" });
