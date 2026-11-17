import {
  LegendList,
  type LegendListProps,
  type LegendListRef,
} from "@legendapp/list/react";
import { cx } from "class-variance-authority";
import type { Ref } from "react";

export type VirtualListRef = LegendListRef;

export type VirtualListProps<ItemT = unknown> = LegendListProps<ItemT> & {
  ref?: Ref<LegendListRef>;
};

export function VirtualList<ItemT>({
  className,
  ...props
}: VirtualListProps<ItemT>) {
  return (
    <LegendList
      data-slot="virtual-list"
      className={cx(
        "h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain [overflow-anchor:none]",
        className,
      )}
      {...props}
    />
  );
}
