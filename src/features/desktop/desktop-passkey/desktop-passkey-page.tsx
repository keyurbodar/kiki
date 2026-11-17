import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/primitives/button";
import { AuthActions, AuthFrame, AuthNote, FieldError } from "../auth-frame";
import {
  encodeCredential,
  type PasskeyRequest,
  parsePasskeyRequest,
  passkeyErrorMessage,
  passkeyReturnUrl,
  runPasskeyCeremony,
} from "./passkey";

type Status =
  | { kind: "ready"; error: string | null }
  | { kind: "working" }
  | { kind: "returned"; href: string };

export function DesktopPasskeyPage() {
  const hash = useRouterState({ select: (state) => state.location.hash });
  const [key, setKey] = useState(hash);
  if (hash !== "" && hash !== key) setKey(hash);
  return <PasskeyPrompt key={key} />;
}

function PasskeyPrompt() {
  const [request] = useState(() => parsePasskeyRequest(window.location.hash));
  const [status, setStatus] = useState<Status>({ kind: "ready", error: null });

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (request === undefined) {
    return (
      <AuthFrame
        title="This link has expired"
        subtitle="Start again from the Capy desktop app"
      />
    );
  }

  if (status.kind === "returned") {
    return (
      <AuthFrame
        title="Return to Capy"
        subtitle={
          request.op === "create"
            ? "The desktop app is adding your passkey, you can close this tab"
            : "The desktop app is signing you in, you can close this tab"
        }
      >
        <AuthActions>
          <Button
            intent="accent"
            size="base"
            className="w-full"
            render={<a href={status.href}>Open Capy</a>}
          />
        </AuthActions>
      </AuthFrame>
    );
  }

  const start = () => {
    setStatus({ kind: "working" });
    runPasskeyCeremony(request).then(
      (credential) => {
        const href = passkeyReturnUrl(request, {
          passkey_credential: encodeCredential(credential),
        });
        setStatus({ kind: "returned", href });
        window.location.assign(href);
      },
      (error: unknown) =>
        setStatus({
          kind: "ready",
          error: passkeyErrorMessage(request.op, error),
        }),
    );
  };

  const working = status.kind === "working";
  const error = status.kind === "ready" ? status.error : null;
  return (
    <AuthFrame {...promptCopy(request)}>
      <AuthActions>
        <Button
          intent="accent"
          size="base"
          className="w-full"
          loading={working}
          loadingLabel="Waiting for your passkey"
          onClick={start}
        >
          {error !== null
            ? "Try again"
            : request.op === "create"
              ? "Add passkey"
              : "Continue with a passkey"}
        </Button>
        {request.inApp ? (
          <Button
            size="base"
            className="w-full"
            disabled={working}
            onClick={() => window.open(window.location.pathname)}
          >
            Use your browser instead
          </Button>
        ) : null}
        <Button
          size="base"
          className="w-full"
          disabled={working}
          render={
            <a href={passkeyReturnUrl(request, { passkey_error: "cancelled" })}>
              Cancel
            </a>
          }
        />
        <FieldError>{error}</FieldError>
        {request.inApp ? (
          <AuthNote>Security keys work only in your browser</AuthNote>
        ) : null}
      </AuthActions>
    </AuthFrame>
  );
}

function promptCopy(request: PasskeyRequest) {
  if (request.op === "get") {
    return {
      title: "Sign in to the Capy desktop app",
      subtitle:
        "The Capy desktop app asked to sign in with your passkey, continue only if you just chose Continue with a passkey in the app",
    };
  }
  const name = request.options.user.name;
  return {
    title: "Add a passkey to your Capy desktop app",
    subtitle: `The Capy desktop app asked to add a passkey${name === undefined ? "" : ` to ${name}`}, continue only if you just chose Add in the app`,
  };
}
