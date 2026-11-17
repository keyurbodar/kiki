import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { type AccountLinkPreview, isUsableToken } from "./account-link-preview";

export type AccountLinkStep =
  | { step: "loading" }
  | { step: "failed" }
  | {
      step: "confirm";
      token: string;
      preview: AccountLinkPreview;
      linking: boolean;
    };

export type AccountLinkPageProps = {
  token: string | undefined;
  provider: string;
  icon: ReactNode;
  connectedHref: string;
  preview: (token: string) => Promise<AccountLinkPreview>;
  complete: (token: string) => Promise<unknown>;
  avatar?: (preview: AccountLinkPreview) => ReactNode;
  navigate?: (href: string) => void;
};

const replaceLocation = (href: string) => window.location.replace(href);

export function AccountLinkPage({
  token,
  provider,
  icon,
  connectedHref,
  preview,
  complete,
  avatar,
  navigate = replaceLocation,
}: AccountLinkPageProps) {
  const [state, setState] = useState<AccountLinkStep>({ step: "loading" });
  const current = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (current.current === token && token !== undefined) return;
    current.current = token;
    if (!isUsableToken(token)) {
      setState({ step: "failed" });
      return;
    }
    setState({ step: "loading" });
    preview(token).then(
      (result) => {
        if (current.current === token)
          setState({ step: "confirm", token, preview: result, linking: false });
      },
      () => {
        if (current.current === token) setState({ step: "failed" });
      },
    );
  }, [preview, token]);

  const link = (confirm: Extract<AccountLinkStep, { step: "confirm" }>) => {
    setState({ ...confirm, linking: true });
    complete(confirm.token).then(
      () => navigate(connectedHref),
      () => setState({ step: "failed" }),
    );
  };

  return (
    <main className="grid h-dvh place-items-center bg-background px-6 pt-(--safe-top)">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 p-6 text-center">
        <div className="grid size-10 place-items-center rounded-md bg-secondary [&_img]:size-6 [&_svg]:size-6">
          {icon}
        </div>
        {state.step === "failed" ? (
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-medium text-foreground">
              {provider} account link failed
            </h1>
            <p className="text-sm font-normal text-muted-foreground-1">
              Request a new link from {provider} and try again
            </p>
          </div>
        ) : state.step === "loading" ? (
          <>
            <h1 className="text-base font-medium text-foreground">
              Checking your {provider} link
            </h1>
            <DotGridIcon
              size="sm"
              role="status"
              aria-hidden={false}
              aria-label={`Checking ${provider} link`}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-base font-medium text-foreground">
                Link this {provider} account?
              </h1>
              <p className="text-sm font-normal text-muted-foreground-1">
                Messages it sends to Capy will run as you in{" "}
                {state.preview.orgName}, with your projects and connected
                accounts
              </p>
            </div>
            <div className="flex w-full items-center gap-3 rounded-md bg-secondary px-3 py-2.5 text-left">
              {avatar?.(state.preview)}
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {state.preview.externalUserName ??
                    state.preview.externalUserId}
                </span>
                <span className="truncate text-sm font-normal text-muted-foreground-1">
                  {state.preview.workspaceName ?? `${provider} workspace`}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">
              Continue only for your own {provider} account, never for a link
              someone sent you
            </p>
            <div className="flex w-full justify-end gap-2">
              <Button
                data-track-owner="features/integrations/account-link-page.tsx#AccountLinkPage:Button[Cancel]"
                variant="ghost"
                disabled={state.linking}
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              <Button
                data-track-owner="features/integrations/account-link-page.tsx#AccountLinkPage:Button[Link account]"
                intent="accent"
                disabled={state.linking}
                aria-busy={state.linking}
                onClick={() => link(state)}
              >
                {state.linking ? "Linking" : "Link account"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
