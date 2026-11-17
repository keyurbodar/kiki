import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/primitives/button";

export type SignInButtonProps = {
  children: ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  "data-track-owner"?: string;
};

export function SignInButton({
  children,
  variant = "solid",
  size = "sm",
  className,
  ...props
}: SignInButtonProps) {
  return (
    <Button
      data-track-owner={props["data-track-owner"]}
      variant={variant}
      size={size}
      className={className}
      render={<Link to="/sign-in" />}
    >
      {children}
    </Button>
  );
}
