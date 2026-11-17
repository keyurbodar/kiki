import { Field } from "@base-ui/react/field";
import { useAtomSet } from "@effect/atom-react";
import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import {
  AuthDivider,
  AuthFooter,
  AuthHeader,
  AuthNote,
  AuthStep,
  authLinkClassName,
  CodeField,
  FieldError,
  OAuthButtons,
  safeRedirect,
} from "../shared";
import type { FlowResult } from "../sign-in/sign-in-flow";
import { signUpFlowAtom } from "./atoms";
import {
  parseSignUpStep,
  type SignUpAction,
  type SignUpStep,
} from "./sign-up-flow";

export interface SignUpPageProps {
  prefillEmail?: string | undefined;
  redirectUrl?: string | undefined;
  initialStep?: string | undefined;
}

export function SignUpPage({
  prefillEmail,
  redirectUrl,
  initialStep,
}: SignUpPageProps) {
  const router = useRouter();
  const flow = useAtomSet(signUpFlowAtom, { mode: "promise" });
  const redirectTo = safeRedirect(redirectUrl);
  const [step, setStep] = useState<SignUpStep>(() =>
    parseSignUpStep(initialStep),
  );
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  const handle = (result: FlowResult<SignUpStep>) => {
    switch (result.kind) {
      case "step":
        setStep(result.step);
        setCode("");
        setError(null);
        return;
      case "complete":
        return router.history.replace(redirectTo);
      case "error":
        return setError(result.message);
      case "redirect":
        return router.history.push(result.href);
    }
  };

  const run = (action: SignUpAction) => {
    if (inFlight.current) return Promise.resolve(undefined);
    inFlight.current = true;
    setSubmitting(true);
    return flow(action).then((result) => {
      if (result.kind !== "complete") {
        inFlight.current = false;
        setSubmitting(false);
      }
      handle(result);
      return result;
    });
  };

  const submit = (action: SignUpAction) => (event: FormEvent) => {
    event.preventDefault();
    run(action);
  };

  if (step === "verify-code")
    return (
      <AuthStep key="verify-code">
        <AuthHeader
          title="Check your email"
          subtitle={`Enter the code sent to ${email.trim() || "your email"}`}
        />
        <form
          className="flex flex-col gap-3"
          onSubmit={submit({ kind: "verify", code })}
        >
          <CodeField
            value={code}
            onChange={(value) => {
              setCode(value);
              setError(null);
            }}
            onComplete={(value) => run({ kind: "verify", code: value })}
            autoFocus
          />
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
          <FieldError>{error}</FieldError>
        </form>
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="link"
            size="auto-sm"
            onClick={() =>
              run({ kind: "resend" }).then((result) => {
                if (result?.kind === "step")
                  toast.success("Verification code sent");
              })
            }
          >
            Resend code
          </Button>
          <Button
            variant="link"
            size="auto-sm"
            onClick={() => {
              setStep("start");
              setCode("");
              setError(null);
            }}
          >
            Use another method
          </Button>
        </div>
      </AuthStep>
    );

  return (
    <AuthStep key="start">
      <AuthHeader title="Create your Capy account" />
      <OAuthButtons
        label="Continue"
        onSelect={(provider) => run({ kind: "oauth", provider, redirectTo })}
        disabled={submitting}
      />
      <AuthDivider />
      <form
        className="flex flex-col gap-3"
        onSubmit={submit({ kind: "create", email, password, redirectTo })}
      >
        <Field.Root className="flex flex-col gap-2">
          <Label htmlFor="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
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
        </Field.Root>
        <Field.Root className="flex flex-col gap-2">
          <Label htmlFor="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="Create a password"
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
          Continue
        </Button>
        <FieldError>{error}</FieldError>
      </form>
      <AuthNote>
        By signing up, you agree to our{" "}
        <a
          href="https://scrapybara.com/legal/terms"
          target="_blank"
          rel="noreferrer"
          className={authLinkClassName}
        >
          Terms of service
        </a>{" "}
        and{" "}
        <a
          href="https://scrapybara.com/legal/privacy"
          target="_blank"
          rel="noreferrer"
          className={authLinkClassName}
        >
          Privacy policy
        </a>
      </AuthNote>
      <AuthFooter>
        Already have an account?
        <Link
          to="/sign-in"
          search={{
            email: email.trim() || undefined,
            redirect_url: redirectUrl,
          }}
          className={authLinkClassName}
        >
          Sign in
        </Link>
      </AuthFooter>
    </AuthStep>
  );
}
