import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import googleUrl from "./google.svg?url";

export type OAuthProvider = "google" | "github";
export type LastUsed = OAuthProvider | "passkey" | "email";

export function LastUsedBadge() {
  return (
    <span className="pointer-events-none absolute -top-1.5 right-2 flex h-(--h-badge-xs) items-center rounded-sm border-hairline border-border-2 bg-(--button) px-1 text-2xs font-medium text-muted-foreground-1 shadow-(--sh-plate)">
      Last used
    </span>
  );
}

export function GoogleIcon() {
  return (
    <img
      src={googleUrl}
      alt=""
      aria-hidden
      className="size-(--icon-base) opacity-100"
    />
  );
}

export function OAuthButtons({
  label,
  onSelect,
  onPasskey,
  disabled,
  lastUsed,
}: {
  label: string;
  onSelect: (provider: OAuthProvider) => void;
  onPasskey?: (() => void) | undefined;
  disabled?: boolean | undefined;
  lastUsed?: LastUsed | undefined;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        size="base"
        className="w-full"
        disabled={disabled}
        onClick={() => onSelect("google")}
      >
        <GoogleIcon />
        {label} with Google
        {lastUsed === "google" ? <LastUsedBadge /> : null}
      </Button>
      <Button
        size="base"
        className="w-full"
        disabled={disabled}
        onClick={() => onSelect("github")}
      >
        <Icon name="github" />
        {label} with GitHub
        {lastUsed === "github" ? <LastUsedBadge /> : null}
      </Button>
      {onPasskey === undefined ? null : (
        <Button
          size="base"
          className="w-full"
          disabled={disabled}
          onClick={onPasskey}
        >
          <Icon name="passkeys" />
          {label} with a passkey
          {lastUsed === "passkey" ? <LastUsedBadge /> : null}
        </Button>
      )}
    </div>
  );
}
