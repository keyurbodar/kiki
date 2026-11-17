import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { Button } from "@/primitives/button";
import {
  AuthFooter,
  AuthHeader,
  AuthPending,
  AuthStep,
  authLinkClassName,
} from "../shared";
import { emailLinkAtom, type VerifyStatus } from "./atoms";

export const verifyFailures = {
  failed: {
    title: "Verification failed",
    body: "The link is invalid or was already used, request a new one",
  },
  expired: {
    title: "Link expired",
    body: "The verification link has expired, request a new one",
  },
  mismatch: {
    title: "Different device",
    body: "Open the link on the same device and browser you started from",
  },
} as const;

export const parseVerifyStatus = (
  value: string | undefined,
): VerifyStatus | undefined =>
  value === "verifying" || (value !== undefined && value in verifyFailures)
    ? (value as VerifyStatus)
    : undefined;

export type VerifyReturnTo = "/sign-in" | "/sign-up";

export function VerifyEmailPage({
  status,
  returnTo,
}: {
  status?: string | undefined;
  returnTo: VerifyReturnTo;
}) {
  const verified = AsyncResult.getOrElse(
    useAtomValue(emailLinkAtom),
    (): VerifyStatus => "verifying",
  );
  const current = parseVerifyStatus(status) ?? verified;
  const search = { email: undefined, redirect_url: undefined };

  if (current === "verifying")
    return (
      <AuthStep key="verifying">
        <AuthHeader title="Verifying your email" />
        <AuthPending label="This only takes a moment" />
      </AuthStep>
    );

  const failure = verifyFailures[current];
  return (
    <AuthStep key={current}>
      <AuthHeader title={failure.title} subtitle={failure.body} />
      <Button
        intent="accent"
        size="base"
        className="w-full"
        render={<Link to={returnTo} search={search} />}
      >
        {returnTo === "/sign-in" ? "Return to sign in" : "Return to sign up"}
      </Button>
      {returnTo === "/sign-in" ? (
        <AuthFooter>
          Don't have an account?
          <Link to="/sign-up" search={search} className={authLinkClassName}>
            Sign up
          </Link>
        </AuthFooter>
      ) : (
        <AuthFooter>
          Already have an account?
          <Link to="/sign-in" search={search} className={authLinkClassName}>
            Sign in
          </Link>
        </AuthFooter>
      )}
    </AuthStep>
  );
}
