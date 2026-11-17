import { useAtomSet } from "@effect/atom-react";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/primitives/button";
import { AuthHeader, AuthPending, AuthStep, safeRedirect } from "../shared";
import { ssoCallbackAtom } from "./atoms";

const failureMessage = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : "Something went wrong, try again";

export function SsoCallbackPage({
  redirectUrl,
}: {
  redirectUrl?: string | undefined;
}) {
  const router = useRouter();
  const complete = useAtomSet(ssoCallbackAtom, { mode: "promise" });
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the callback runs once per visit, like Clerk's handleRedirectCallback
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    complete()
      .then(() => router.history.replace(safeRedirect(redirectUrl)))
      .catch((cause) => setError(failureMessage(cause)));
  }, []);

  const returnToSignIn = (
    <Button
      variant="solid"
      size="base"
      className="w-full"
      render={<Link to="/sign-in" />}
    >
      Return to sign in
    </Button>
  );

  if (error !== null)
    return (
      <AuthStep key="sso-callback-failed">
        <AuthHeader title="Could not finish signing in" subtitle={error} />
        {returnToSignIn}
      </AuthStep>
    );

  return (
    <AuthStep key="sso-callback">
      <AuthHeader title="Signing you in" />
      <AuthPending label="This only takes a moment" />
      {returnToSignIn}
    </AuthStep>
  );
}
