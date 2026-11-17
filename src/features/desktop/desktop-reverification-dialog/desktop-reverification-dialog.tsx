import { Field } from "@base-ui/react/field";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type DesktopVerifyStep, desktopBridge } from "@/lib/desktop-bridge";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import {
  currentReverification,
  nextVerifyStep,
  type ReverificationPrompt,
  subscribeReverification,
  VERIFY_FAILED,
  VERIFY_ON_WEB,
  type VerifyState,
  verifyDescription,
} from "./reverification";

const CODE_LENGTH = 6;

export function DesktopReverificationDialog() {
  const prompt = useSyncExternalStore(
    subscribeReverification,
    currentReverification,
    () => undefined,
  );
  return prompt === undefined ? null : <VerifyDialog prompt={prompt} />;
}

export function VerifyDialog({ prompt }: { prompt: ReverificationPrompt }) {
  const [state, setState] = useState<VerifyState>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const verify = useCallback(async (step: DesktopVerifyStep) => {
    const session = desktopBridge()?.session;
    if (session === undefined) {
      return { ok: false as const, message: VERIFY_ON_WEB };
    }
    inFlight.current = true;
    setPending(true);
    return session
      .verify(step)
      .catch(() => ({ ok: false as const, message: VERIFY_FAILED }))
      .finally(() => {
        inFlight.current = false;
        if (mounted.current) setPending(false);
      });
  }, []);

  const sendEmailCode = useCallback(
    async (emailAddressId: string, identifier: string | null) => {
      if (inFlight.current) return;
      const result = await verify({
        kind: "prepare-email-code",
        emailAddressId,
      });
      if (!mounted.current) return;
      if (result.ok) {
        setCode("");
        setError(null);
        setState({ kind: "email-code", identifier });
      } else {
        setState({ kind: "blocked", message: result.message });
      }
    },
    [verify],
  );

  const advance = useCallback(
    (result: Parameters<typeof nextVerifyStep>[0]) => {
      const next = nextVerifyStep(result);
      if (next.kind === "settle") {
        prompt.settle(true);
        return;
      }
      if (next.kind === "email-code") {
        void sendEmailCode(next.emailAddressId, next.identifier);
        return;
      }
      if (next.state.kind === "totp" || next.state.kind === "backup-code") {
        setCode("");
        setError(null);
      }
      setState(next.state);
    },
    [prompt, sendEmailCode],
  );

  const attempt = async (step: DesktopVerifyStep) => {
    if (inFlight.current) return;
    const result = await verify(step);
    if (!mounted.current) return;
    if (result.ok) advance(result);
    else setError(result.message);
  };

  useEffect(() => {
    void verify({ kind: "start", level: "second_factor" }).then((result) => {
      if (mounted.current) advance(result);
    });
  }, [verify, advance]);

  const submit =
    (step: () => DesktopVerifyStep) => (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void attempt(step());
    };

  const codeStep = (value: string): DesktopVerifyStep =>
    state.kind === "totp"
      ? { kind: "attempt-totp", code: value }
      : { kind: "attempt-email-code", code: value };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) prompt.settle(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm it's you</DialogTitle>
          <DialogDescription>{verifyDescription(state)}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {state.kind === "loading" ? null : state.kind === "blocked" ? (
            <p className="text-sm font-normal text-muted-foreground">
              {state.message}
            </p>
          ) : state.kind === "password" ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={submit(() => ({ kind: "attempt-password", password }))}
            >
              <Field.Root className="flex flex-col gap-1.5">
                <Label htmlFor="reverify-password">Password</Label>
                <Input
                  id="reverify-password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  disabled={pending}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                  }}
                />
              </Field.Root>
              <Button
                type="submit"
                intent="accent"
                className="w-full"
                disabled={pending}
              >
                Confirm
              </Button>
              {state.emailAddressId === null ? null : (
                <Button
                  type="button"
                  variant="link"
                  size="auto-sm"
                  disabled={pending}
                  onClick={() => {
                    if (state.emailAddressId !== null) {
                      void sendEmailCode(state.emailAddressId, null);
                    }
                  }}
                >
                  Email me a code instead
                </Button>
              )}
              <VerifyError>{error}</VerifyError>
            </form>
          ) : state.kind === "backup-code" ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={submit(() => ({
                kind: "attempt-backup-code",
                code: code.trim(),
              }))}
            >
              <Field.Root className="flex flex-col gap-1.5">
                <Label htmlFor="reverify-backup-code">Backup code</Label>
                <Input
                  id="reverify-backup-code"
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  value={code}
                  disabled={pending}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError(null);
                  }}
                />
              </Field.Root>
              <Button
                type="submit"
                intent="accent"
                className="w-full"
                disabled={pending}
              >
                Confirm
              </Button>
              {state.totp ? (
                <Button
                  type="button"
                  variant="link"
                  size="auto-sm"
                  disabled={pending}
                  onClick={() => {
                    setCode("");
                    setError(null);
                    setState({ kind: "totp", backupCode: true });
                  }}
                >
                  Use your authenticator app
                </Button>
              ) : null}
              <VerifyError>{error}</VerifyError>
            </form>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={submit(() => codeStep(code))}
            >
              <Input
                aria-label="Verification code"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={CODE_LENGTH}
                font="numeric"
                autoFocus
                value={code}
                disabled={pending}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/gu, "");
                  setCode(value);
                  setError(null);
                  if (value.length === CODE_LENGTH)
                    void attempt(codeStep(value));
                }}
              />
              <Button
                type="submit"
                intent="accent"
                className="w-full"
                disabled={pending}
              >
                Confirm
              </Button>
              {state.kind === "totp" && state.backupCode ? (
                <Button
                  type="button"
                  variant="link"
                  size="auto-sm"
                  disabled={pending}
                  onClick={() => {
                    setCode("");
                    setError(null);
                    setState({ kind: "backup-code", totp: true });
                  }}
                >
                  Use a backup code
                </Button>
              ) : null}
              <VerifyError>{error}</VerifyError>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function VerifyError({ children }: { children: string | null }) {
  if (!children) return null;
  return <p className="text-xs font-normal text-destructive">{children}</p>;
}
