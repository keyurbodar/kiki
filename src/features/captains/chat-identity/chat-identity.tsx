import { useAtomSet } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { type ComponentProps, type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  CaptainAvatar,
  type CaptainAvatarValue,
  captainReactivityKeys,
  defaultCaptainAvatar,
  updateCaptainAtom,
  useCaptain,
  useCaptainOrgId,
} from "@/features/captains/overview";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";

export type CaptainPatch = { name?: string; avatar?: CaptainAvatarValue };

export type ChatIdentityAvatarPicker = (props: {
  value: CaptainAvatarValue;
  onChange: (avatar: CaptainAvatarValue) => void;
  defaultOpen: boolean;
  children: ReactNode;
}) => ReactNode;

export type ChatIdentityProps = ComponentProps<"div"> & {
  jamId?: string;
  orgId?: string;
  fallbackName?: string;
  editable?: boolean;
  defaultEditing?: boolean;
  defaultPickerOpen?: boolean;
  onOpenOverview?: () => void;
  onShare?: (target: { kind: "thread"; id: string; name: string }) => void;
  avatarPicker?: ChatIdentityAvatarPicker;
};

/** The name a rename commits, or undefined when nothing should be saved. */
export function nextCaptainName(draft: string, current: string) {
  const name = draft.trim();
  return name === "" || name === current ? undefined : name;
}

/**
 * The head of a Captain's chat (Capy's CaptainChatIdentity): its avatar and
 * name, editable in place, its description, and links to the overview and
 * to sharing.
 */
export function ChatIdentity({
  jamId = "",
  orgId: orgIdProp,
  fallbackName = "",
  editable = false,
  defaultEditing = false,
  defaultPickerOpen = false,
  onOpenOverview,
  onShare,
  avatarPicker,
  className,
  ...props
}: ChatIdentityProps) {
  const orgId = useCaptainOrgId(orgIdProp);
  const captain = useCaptain(orgId, jamId);
  const update = useAtomSet(updateCaptainAtom, { mode: "promise" });
  const [editing, setEditing] = useState(defaultEditing);
  const name = captain?.name ?? fallbackName;
  const [draft, setDraft] = useState(name);
  const avatar = captain?.avatar ?? defaultCaptainAvatar;

  const save = (payload: CaptainPatch) => {
    if (orgId === undefined) return;
    update({
      params: { orgId, jamId },
      payload,
      reactivityKeys: captainReactivityKeys(orgId, jamId),
    }).catch(() =>
      toast.error("Could not update Captain", { description: name }),
    );
  };

  const commit = () => {
    setEditing(false);
    const next = nextCaptainName(draft, name);
    if (next !== undefined) save({ name: next });
  };

  const tile = <CaptainAvatar avatar={avatar} name={name} size="2xl" />;
  const avatarButton = (
    <button
      type="button"
      aria-label="Change avatar"
      className="grid size-20 cursor-pointer place-items-center rounded outline-none focus-visible:outline-ring-inset"
    >
      {tile}
    </button>
  );

  return (
    <div
      data-slot="captain-chat-identity"
      className={cx(
        "mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 pt-6 pb-2",
        className,
      )}
      {...props}
    >
      {!editable
        ? tile
        : avatarPicker === undefined
          ? avatarButton
          : avatarPicker({
              value: avatar,
              onChange: (next) => save({ avatar: next }),
              defaultOpen: defaultPickerOpen,
              children: avatarButton,
            })}
      <div className="flex h-9 w-full max-w-sm items-center justify-center">
        {editing ? (
          <Input
            variant="blank"
            aria-label="Name"
            value={draft}
            maxLength={100}
            autoFocus
            className="h-9 text-center text-xl font-medium"
            onChange={(event) => setDraft(event.target.value)}
            onFocus={(event) => event.target.select()}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
              if (event.key === "Escape") setEditing(false);
            }}
          />
        ) : editable ? (
          <button
            type="button"
            className="flex h-9 min-w-0 cursor-text items-center rounded px-2 text-xl font-medium text-foreground outline-none focus-visible:outline-ring-inset"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
          >
            <span className="truncate">{name}</span>
          </button>
        ) : (
          <span className="min-w-0 truncate px-2 text-xl font-medium text-foreground">
            {name}
          </span>
        )}
      </div>
      {captain?.description != null && (
        <p className="-mt-3 max-w-sm text-center text-sm text-muted-foreground-1">
          {captain.description}
        </p>
      )}
      <div className="flex items-center gap-4">
        <Button variant="link" size="auto-sm" onClick={onOpenOverview}>
          View Captain
        </Button>
        {onShare !== undefined && (
          <Button
            variant="link"
            size="auto-sm"
            onClick={() => onShare({ kind: "thread", id: jamId, name })}
          >
            <Icon name="arrow-share-left" className="size-(--icon-sm)" />
            Share
          </Button>
        )}
      </div>
    </div>
  );
}
