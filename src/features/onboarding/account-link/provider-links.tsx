import { useAtomSet } from "@effect/atom-react";
import { Schema } from "effect";
import { useCallback, useState } from "react";
import { ApiClient } from "@/data/client/ApiClient";
import { LinearLogo, SlackLogo } from "../callback-surface";
import { AccountLinkPage } from "./account-link-page";
import { AccountLinkPreview, initials } from "./account-link-preview";

export const previewLinearLinkAtom = ApiClient.mutation(
  "integrations",
  "previewLinearLink",
);
export const completeLinearLinkAtom = ApiClient.mutation(
  "integrations",
  "completeLinearLink",
);
export const previewSlackLinkAtom = ApiClient.mutation(
  "integrations",
  "previewSlackLink",
);
export const completeSlackLinkAtom = ApiClient.mutation(
  "integrations",
  "completeSlackLink",
);

const decodePreview = Schema.decodeUnknownPromise(AccountLinkPreview);

export function LinearLinkPage({ token }: { token: string | undefined }) {
  const previewLink = useAtomSet(previewLinearLinkAtom, { mode: "promise" });
  const completeLink = useAtomSet(completeLinearLinkAtom, { mode: "promise" });
  const preview = useCallback(
    (value: string) =>
      previewLink({ payload: { token: value } }).then(decodePreview),
    [previewLink],
  );
  const complete = useCallback(
    (value: string) => completeLink({ payload: { token: value } }),
    [completeLink],
  );
  return (
    <AccountLinkPage
      token={token}
      provider="Linear"
      icon={<LinearLogo />}
      connectedHref="/settings/integrations/linear?linear=connected"
      preview={preview}
      complete={complete}
    />
  );
}

export function SlackLinkPage({ token }: { token: string | undefined }) {
  const previewLink = useAtomSet(previewSlackLinkAtom, { mode: "promise" });
  const completeLink = useAtomSet(completeSlackLinkAtom, { mode: "promise" });
  const preview = useCallback(
    (value: string) =>
      previewLink({ payload: { token: value } }).then(decodePreview),
    [previewLink],
  );
  const complete = useCallback(
    (value: string) => completeLink({ payload: { token: value } }),
    [completeLink],
  );
  return (
    <AccountLinkPage
      token={token}
      provider="Slack"
      icon={<SlackLogo />}
      connectedHref="/settings/integrations/slack?slack=connected"
      preview={preview}
      complete={complete}
      avatar={(preview) => <SlackAvatar preview={preview} />}
    />
  );
}

export function SlackAvatar({ preview }: { preview: AccountLinkPreview }) {
  const [failed, setFailed] = useState(false);
  const name = preview.externalUserName ?? preview.externalUserId;
  if (preview.avatarUrl && !failed) {
    return (
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-xs">
        <img
          src={preview.avatarUrl}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-foreground">
      {initials(name)}
    </span>
  );
}
