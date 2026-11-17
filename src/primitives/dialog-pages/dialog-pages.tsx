import type { ComponentProps } from "react";

export type DialogPagesProps = ComponentProps<"div">;

export function DialogPages(props: DialogPagesProps) {
  return <div data-slot="dialog-pages" {...props} />;
}

export type DialogPageProps = ComponentProps<"div">;

export function DialogPage(props: DialogPageProps) {
  return <div data-slot="dialog-page" {...props} />;
}
