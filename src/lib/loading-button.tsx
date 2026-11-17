import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/primitives/button";

export type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export function LoadingButton({
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading ? "" : undefined}
    >
      {loading && loadingLabel != null ? loadingLabel : children}
    </Button>
  );
}
