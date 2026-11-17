import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button, type ButtonVariants } from "@/primitives/button";

export const signInHref = (redirect: string) =>
  `/sign-in?${new URLSearchParams({ redirect_url: redirect }).toString()}`;

export function useSignInHref() {
  return signInHref(useLocation({ select: (location) => location.href }));
}

export type SignInLinkProps = {
  children: ReactNode;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  className?: string;
};

export function SignInLink({
  children,
  variant = "solid",
  size = "sm",
  className,
}: SignInLinkProps) {
  const href = useSignInHref();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      render={<a href={href} />}
    >
      {children}
    </Button>
  );
}
