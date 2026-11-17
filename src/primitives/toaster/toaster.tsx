import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

export type ToasterProps = ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return <Sonner {...props} />;
}
