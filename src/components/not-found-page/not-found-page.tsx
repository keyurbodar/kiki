import type { ComponentProps } from "react";

export type NotFoundPageProps = ComponentProps<"main">;

export function NotFoundPage(props: NotFoundPageProps) {
  return <main {...props} />;
}
