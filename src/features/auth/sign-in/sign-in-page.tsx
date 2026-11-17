import { Field } from "@base-ui/react/field";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, useRouter } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import {
  AuthDivider,
  AuthFooter,
  AuthHeader,
  AuthStep,
  authLinkClassName,
  CodeField,
  FieldError,
  LastUsedBadge,
  OAuthButtons,
  type OAuthProvider,
  safeRedirect,
  usePasskeySupport,
} from "../shared";
import { lastUsedAtom } from "../shared/atoms";
import { signInFlowAtom } from "./atoms";
import {
  type FlowResult,
  parseSignInStep,
  type SignInAction,
  type SignInStep,
} from "./sign-in-flow";

export type PasskeyIntent = "add" | "required";

export interface SignInPageProps {
  prefillEmail?: string | undefined;
  redirectUrl?: string | undefined;
  ticket?: string | undefined;
  initialStep?: string | undefined;
  passkeyIntent?: string | undefined;
}

const passkeySubtitle = (intent: string | undefined) =>
  intent === "add"
    ? "Sign in with a passkey you already use to add another"
    : intent === "required"
      ? "Your account requires a passkey sign-in"
      : undefined;

export function SignInPage({
  prefillEmail,
  redirectUrl,
  ticket,
  initialStep,
  passkeyIntent,
}: SignInPageProps) {
  const router = useRouter();
  const flow = useAtomSet(signInFlowAtom, { mode: "promise" });
  const lastUsed = AsyncResult.getOrElse(
    useAtomValue(lastUsedAtom),
    () => undefined,
  );
  const passkeySupported = usePasskeySupport();
  const passkeyFirst = passkeyIntent !== undefined && passkeySupported;
  const redirectTo = safeRedirect(redirectUrl);

  const [step, setStep] = useState<SignInStep>(() =>
    parseSignInStep(initialStep),
  );
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [waitingForPasskey, setWaitingForPasskey] = useState(false);
  const inFlight = useRef(false);
  const passkeyCancelled = useRef(false);
  const ticketSent = useRef(false);

  const goTo = (next: SignInStep) => {
    setStep(next);
    setPassword("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handle = (result: FlowResult<SignInStep>) => {
    switch (result.kind) {
      case "step":
        return goTo(result.step);
      case "complete":
        return router.history.replace(redirectTo);
      case "error":
        return setError(result.message);
      case "redirect":
        return router.history.push(result.href);
    }
  };

  const run = (action: SignInAction) => {
    if (inFlight.current) return Promise.resolve(undefined);
    inFlight.current = true;
    setSubmitting(true);
    return flow(action)
      .then((result) => {
        handle(result);
        return result;
      })
      .finally(() => {
        inFlight.current = false;
        setSubmitting(false);
      });
  };

  const sendCode = () =>
    run({ kind: "send-email-code", email }).then((result) => {
      if (result?.kind === "step") toast.success("Verification code sent");
    });

  const startPasskey = () => {
    passkeyCancelled.current = false;
    setWaitingForPasskey(true);
    setError(null);
    flow({ kind: "passkey" }).then((result) => {
      setWaitingForPasskey(false);
      if (!passkeyCancelled.current) handle(result);
    });
  };

  const cancelPasskey = () => {
    passkeyCancelled.current = true;
    setWaitingForPasskey(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once per ticket, like Capy's ticket effect
  useEffect(() => {
    if (ticket === undefined || ticketSent.current) return;
    ticketSent.current = true;
    run({ kind: "ticket", ticket });
  }, [ticket]);

  const oauth = (provider: OAuthProvider) =>
    run({ kind: "oauth", provider, redirectTo });

  const submit = (action: SignInAction) => (event: FormEvent) => {
    event.preventDefault();
    run(action);
  };

  const shownEmail = email.trim() || "your email";
  const useAnotherMethod = (
    <Button variant="link" size="auto-sm" onClick={() => goTo("start")}>
      Use another method
    </Button>
  );
  const backToSignIn = (
    <AuthFooter>
      <Button variant="link" size="auto-sm" onClick={() => goTo("start")}>
        Back to sign in
      </Button>
    </AuthFooter>
  );
  const continueButton = (
    <Button
      type="submit"
      intent="accent"
      size="base"
      className="w-full"
      disabled={submitting}
      aria-busy={submitting || undefined}
    >
      Continue
    </Button>
  );
  const codeForm = (kind: "email-code" | "totp" | "reset-code") => (
    <form className="flex flex-col gap-3" onSubmit={submit({ kind, code })}>
      <CodeField
        value={code}
        onChange={(value) => {
          setCode(value);
          setError(null);
        }}
        onComplete={(value) => run({ kind, code: value })}
        autoFocus
      />
      {continueButton}
      <FieldError>{error}</FieldError>
    </form>
  );

  switch (step) {
    case "start":
      return (
        <AuthStep key="start">
          <AuthHeader
            title="Sign in to Capy"
            subtitle={passkeySubtitle(passkeyIntent)}
          />
          {waitingForPasskey ? (
            <div className="flex w-full flex-col gap-2">
              <Button size="base" className="w-full" disabled aria-busy>
                Waiting for your passkey
              </Button>
              <Button
                variant="ghost"
                size="base"
                className="w-full"
                onClick={cancelPasskey}
              >
                Use another method
              </Button>
            </div>
          ) : (
            <>
              {passkeyFirst ? (
                <>
                  <Button
                    intent="accent"
                    size="base"
                    className="w-full"
                    onClick={startPasskey}
                  >
                    <Icon name="passkeys" />
                    Continue with a passkey
                  </Button>
                  <AuthDivider />
                </>
              ) : null}
              <OAuthButtons
                label="Continue"
                onSelect={oauth}
                onPasskey={
                  passkeySupported && !passkeyFirst ? startPasskey : undefined
                }
                lastUsed={lastUsed === "email" ? undefined : lastUsed}
              />
              <AuthDivider />
              <form
                className="flex flex-col gap-3"
                onSubmit={submit({ kind: "identify", email, redirectTo })}
              >
                <Field.Root className="flex flex-col gap-2">
                  <Label htmlFor="sign-in-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="sign-in-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="capy@scrapybara.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.currentTarget.value);
                        setError(null);
                      }}
                    />
                    {lastUsed === "email" ? <LastUsedBadge /> : null}
                  </div>
                </Field.Root>
                <Button
                  type="submit"
                  intent={passkeyFirst ? undefined : "accent"}
                  size="base"
                  className="w-full"
                  disabled={submitting}
                  aria-busy={submitting || undefined}
                >
                  Continue
                </Button>
                <FieldError>{error}</FieldError>
              </form>
            </>
          )}
          <AuthFooter>
            Don't have an account?
            <Link
              to="/sign-up"
              search={{
                email: email.trim() || undefined,
                redirect_url: redirectUrl,
              }}
              className={authLinkClassName}
            >
              Sign up
            </Link>
          </AuthFooter>
        </AuthStep>
      );
    case "password":
      return (
        <AuthStep key="password">
          <AuthHeader title="Welcome back" subtitle={shownEmail} />
          <form
            className="flex flex-col gap-3"
            onSubmit={submit({ kind: "password", password })}
          >
            <Field.Root className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sign-in-password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  size="auto-sm"
                  onClick={() => goTo("forgot-password")}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="sign-in-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                autoFocus
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  setError(null);
                }}
              />
            </Field.Root>
            <Button
              type="submit"
              intent="accent"
              size="base"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting || undefined}
            >
              Sign in
            </Button>
            <FieldError>{error}</FieldError>
          </form>
          <div className="flex flex-col items-center gap-2">
            <Button variant="link" size="auto-sm" onClick={sendCode}>
              Email me a code instead
            </Button>
            {useAnotherMethod}
          </div>
        </AuthStep>
      );
    case "email-code":
      return (
        <AuthStep key="email-code">
          <AuthHeader
            title="Check your email"
            subtitle={`Enter the code sent to ${shownEmail}`}
          />
          {codeForm("email-code")}
          <div className="flex flex-col items-center gap-2">
            <Button variant="link" size="auto-sm" onClick={sendCode}>
              Resend code
            </Button>
            {useAnotherMethod}
          </div>
        </AuthStep>
      );
    case "totp":
      return (
        <AuthStep key="totp">
          <AuthHeader
            title="Two-step verification"
            subtitle="Enter the code from your authenticator app"
          />
          {codeForm("totp")}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="link"
              size="auto-sm"
              onClick={() => goTo("backup-code")}
            >
              Use a backup code
            </Button>
            {useAnotherMethod}
          </div>
        </AuthStep>
      );
    case "backup-code":
      return (
        <AuthStep key="backup-code">
          <AuthHeader
            title="Two-step verification"
            subtitle="Enter one of the backup codes you saved when you set up your authenticator"
          />
          <form
            className="flex flex-col gap-3"
            onSubmit={submit({ kind: "backup-code", code })}
          >
            <Field.Root className="flex flex-col gap-1.5">
              <Label htmlFor="sign-in-backup-code">Backup code</Label>
              <Input
                id="sign-in-backup-code"
                value={code}
                onChange={(event) => {
                  setCode(event.currentTarget.value);
                  setError(null);
                }}
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
              />
            </Field.Root>
            <Button
              type="submit"
              intent="accent"
              size="base"
              className="w-full"
              disabled={submitting || code.trim() === ""}
              aria-busy={submitting || undefined}
            >
              Continue
            </Button>
            <FieldError>{error}</FieldError>
          </form>
          <div className="flex flex-col items-center gap-2">
            <Button variant="link" size="auto-sm" onClick={() => goTo("totp")}>
              Use your authenticator app
            </Button>
            {useAnotherMethod}
          </div>
        </AuthStep>
      );
    case "forgot-password":
      return (
        <AuthStep key="forgot-password">
          <AuthHeader
            title="Reset your password"
            subtitle={`We'll email a code to ${shownEmail}`}
          />
          <Button
            intent="accent"
            size="base"
            className="w-full"
            disabled={submitting}
            onClick={() => run({ kind: "send-reset-code", email })}
          >
            Send reset code
          </Button>
          <AuthDivider />
          <OAuthButtons label="Sign in" onSelect={oauth} />
          {backToSignIn}
        </AuthStep>
      );
    case "reset-code":
      return (
        <AuthStep key="reset-code">
          <AuthHeader
            title="Check your email"
            subtitle={`Enter the code sent to ${shownEmail}`}
          />
          {codeForm("reset-code")}
          {backToSignIn}
        </AuthStep>
      );
    case "reset-password":
      return (
        <AuthStep key="reset-password">
          <AuthHeader
            title="Set a new password"
            subtitle="Signs out your other sessions"
          />
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (newPassword === confirmPassword)
                run({ kind: "new-password", password: newPassword });
              else setError("Passwords must match");
            }}
          >
            <Field.Root className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                name="new-password"
                autoComplete="new-password"
                required
                autoFocus
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.currentTarget.value);
                  setError(null);
                }}
              />
            </Field.Root>
            <Field.Root className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                required
                placeholder="Confirm new password"
                aria-invalid={error === "Passwords must match" || undefined}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.currentTarget.value);
                  setError(null);
                }}
              />
              <FieldError>{error}</FieldError>
            </Field.Root>
            <Button
              type="submit"
              intent="accent"
              size="base"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting || undefined}
            >
              Update password
            </Button>
          </form>
          {backToSignIn}
        </AuthStep>
      );
  }
}
