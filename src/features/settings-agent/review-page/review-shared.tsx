import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult, type Atom } from "effect/reactivity";
import type { ReactNode } from "react";
import { organizationsAtom, useActiveOrgId } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { CheckIcon } from "./review-icons";
import {
  type AutoReviewMode,
  adminAccess,
  autoReviewModes,
  flexTierCopy,
  type ReviewTier,
  reviewTierCopy,
  reviewTiers,
} from "./review-model";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const checkClass = "size-(--icon-sm) shrink-0 text-foreground";

/** The current organization and whether the viewer may change its settings. */
export function useReviewOrg() {
  const organizations = useAtomValue(organizationsAtom);
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  const activeOrgId = useActiveOrgId();
  const org = AsyncResult.isSuccess(organizations)
    ? organizations.value.find((candidate) => candidate.id === activeOrgId)
    : undefined;
  return {
    org,
    orgId: org?.id,
    // A failed organizations read is not an org that is still loading.
    orgFailed: AsyncResult.isFailure(organizations),
    refreshOrganizations,
    ...adminAccess(org?.accessLevel),
  };
}

/** A query's value (current or previous), whether it failed with none, and a retry. */
export function useQuery<A>(
  atom: Atom.Atom<AsyncResult.AsyncResult<A, unknown>>,
) {
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const value = Option.getOrUndefined(AsyncResult.value(result));
  return {
    value,
    failed: AsyncResult.isFailure(result) && value === undefined,
    refresh,
  };
}

export function ReviewEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
      {children}
    </div>
  );
}

/** GitHub owner initial; mocks never fetch avatars from github.com. */
export function RepoAvatar({ repo }: { repo: string }) {
  const owner = repo.split("/")[0] ?? repo;
  return (
    <span
      data-slot="avatar"
      aria-hidden
      className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-2xs font-medium text-muted-foreground-1 uppercase"
    >
      {owner.slice(0, 1)}
    </span>
  );
}

export function RepoName({ repo }: { repo: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <RepoAvatar repo={repo} />
      <span className="truncate" title={repo}>
        {repo}
      </span>
    </span>
  );
}

/** Capy's MenuRowLabel: icon, label, optional description and trailing slot. */
export function MenuRowLabel({
  icon,
  label,
  description,
  trailing,
  density,
}: {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  density?: "rich";
}) {
  const rich = density === "rich" && description != null;
  return (
    <span
      data-slot="menu-row"
      className="flex min-w-0 flex-1 items-center gap-2 text-left"
    >
      {icon ? (
        <span
          className={cx(
            "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted",
            rich && "h-5 self-start",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground">
          {label}
        </span>
        {description ? (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span
          className={cx(
            "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1",
            rich && "h-5 self-start",
          )}
        >
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

/** Capy's AutoReviewModeMenu: Off, Once, Every push. */
export function AutoReviewModeMenu({
  value,
  trigger,
  onPick,
}: {
  value?: AutoReviewMode;
  trigger: React.ReactElement;
  onPick: (mode: AutoReviewMode) => void;
}) {
  return (
    <Menu>
      <MenuTrigger render={trigger} />
      <MenuContent align="end" className="w-72">
        {autoReviewModes.map((mode) => (
          <MenuItem
            key={mode.value}
            density="rich"
            onClick={() => {
              if (mode.value !== value) onPick(mode.value);
            }}
          >
            <MenuRowLabel
              density="rich"
              label={mode.label}
              description={mode.hint}
              trailing={
                mode.value === value ? (
                  <CheckIcon className={checkClass} />
                ) : null
              }
            />
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

/** Capy's ReviewSettingsChoiceMenu: Low, Medium, High, plus an optional default. */
export function ReviewTierMenu({
  value,
  defaultLabel,
  trigger,
  onPick,
}: {
  value: ReviewTier | null;
  defaultLabel?: string;
  trigger: React.ReactElement;
  onPick: (tier: ReviewTier | null) => void;
}) {
  return (
    <Menu>
      <MenuTrigger render={trigger} />
      <MenuContent align="end" className="w-80">
        {reviewTiers.map((tier) => (
          <MenuItem
            key={tier}
            density="rich"
            onClick={() => {
              if (tier !== value) onPick(tier);
            }}
          >
            <MenuRowLabel
              density="rich"
              {...reviewTierCopy[tier]}
              trailing={
                tier === value ? <CheckIcon className={checkClass} /> : null
              }
            />
          </MenuItem>
        ))}
        {defaultLabel !== undefined && (
          <MenuItem
            onClick={() => {
              if (value !== null) onPick(null);
            }}
          >
            <MenuRowLabel
              label={defaultLabel}
              trailing={
                value === null ? <CheckIcon className={checkClass} /> : null
              }
            />
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

export { flexTierCopy };

/** Shown to members: who can change these settings. */
export function ReviewAdminNotice({
  scope,
}: {
  scope: "agent" | "repositories";
}) {
  const { org, isAdmin } = useReviewOrg();
  if (org === undefined || isAdmin) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground-2">
      <span>
        {scope === "agent"
          ? "Tiers, guides, and filters"
          : "Repository settings"}{" "}
        apply to everyone in {org.name} and only admins can change them
      </span>
      <Button
        variant="link"
        size="auto-sm"
        className="whitespace-nowrap text-sm underline underline-offset-2 focus-visible:outline-ring-inset"
        render={<Link to="/settings/org/members" />}
      >
        Ask an admin
      </Button>
    </div>
  );
}
