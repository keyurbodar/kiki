import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { Button } from "@/primitives/button";
import {
  AuthHeader,
  AuthSpinner,
  AuthStep,
  AuthText,
  FieldError,
} from "../shared";
import { mfaStatusAtom, signOutAtom, verifySecondFactorAtom } from "./atoms";

export interface TwoStepWallProps {
  organizationName?: string | undefined;
  requiresSso?: boolean | undefined;
  requiresPasskey?: boolean | undefined;
  onPassed: () => void;
  onSignedOut: () => void;
  onSingleSignOn: () => void;
}

export const wallTitle = (requiresSso: boolean, requiresPasskey: boolean) =>
  requiresSso
    ? "Single sign-on"
    : requiresPasskey
      ? "Passkey sign-in"
      : "Two-step verification";

export function TwoStepWall({
  organizationName,
  requiresSso = false,
  requiresPasskey = false,
  onPassed,
  onSignedOut,
  onSingleSignOn,
}: TwoStepWallProps) {
  const status = useAtomValue(mfaStatusAtom);
  const verify = useAtomSet(verifySecondFactorAtom, { mode: "promise" });
  const signOut = useAtomSet(signOutAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = organizationName ?? "This organization";
  const choice = AsyncResult.getOrElse(status, () => undefined);

  const body =
    choice === undefined ? (
      <div className="flex justify-center">
        <AuthSpinner label="Checking your account" />
      </div>
    ) : requiresSso ? (
      <div className="flex flex-col gap-3">
        <AuthText>
          Sign in through your company's identity provider with your work email
        </AuthText>
        <Button
          intent="accent"
          size="base"
          className="w-full"
          onClick={onSingleSignOn}
        >
          Sign in with single sign-on
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <AuthText>
          {requiresPasskey
            ? `${name} asks for a passkey sign-in, which works in your browser at capy.ai`
            : "Use your authenticator app here, passkeys work in your browser at capy.ai"}
        </AuthText>
        {requiresPasskey ? null : choice.mfaEnabled ? (
          <Button
            intent="accent"
            size="base"
            className="w-full"
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={() => {
              setBusy(true);
              setError(null);
              verify()
                .then((passed) =>
                  passed
                    ? onPassed()
                    : setError(
                        "Enter a code from your authenticator to finish",
                      ),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Verifying" : "Verify with your authenticator"}
          </Button>
        ) : (
          <Button size="base" className="w-full" disabled>
            Set up authenticator app
          </Button>
        )}
        {choice.enterpriseSso ? (
          <Button
            size="base"
            className="w-full"
            disabled={busy}
            onClick={onSingleSignOn}
          >
            Sign in with single sign-on
          </Button>
        ) : null}
      </div>
    );

  return (
    <AuthStep key={choice === undefined ? "checking" : "choose"}>
      <AuthHeader
        title={wallTitle(requiresSso, requiresPasskey)}
        subtitle={`Required by ${name}`}
      />
      {body}
      <FieldError>{error}</FieldError>
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="link"
          size="auto-sm"
          onClick={() => signOut().then(onSignedOut)}
        >
          Sign out
        </Button>
      </div>
    </AuthStep>
  );
}
