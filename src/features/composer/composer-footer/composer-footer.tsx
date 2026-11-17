import type { ComponentProps } from "react";

export type ComposerFooterProps = ComponentProps<"div">;

export function ComposerFooter(props: ComposerFooterProps) {
  return <div {...props} />;
}
