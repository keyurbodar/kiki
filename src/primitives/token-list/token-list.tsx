import type { ComponentProps } from "react";

export type TokenListProps = ComponentProps<"div">;

export function TokenList(props: TokenListProps) {
  return <div data-slot="token-list" {...props} />;
}
