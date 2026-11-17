import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { useAuthState } from "./use-auth-state";

export function signInHref(redirectUrl: string) {
  return `/sign-in?${new URLSearchParams({ redirect_url: redirectUrl })}`;
}

export function RequireSignedIn({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuthState();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoaded && !isSignedIn)
      void navigate({ href: signInHref(window.location.href), replace: true });
  }, [isLoaded, isSignedIn, navigate]);
  if (!isLoaded || !isSignedIn) return null;
  return children;
}
