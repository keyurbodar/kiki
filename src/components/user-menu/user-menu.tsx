import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Effect, Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import type { ComponentProps, MouseEvent } from "react";
import { AppearanceMenuItems } from "@/components/appearance-menu";
import {
  ArrowsRepeatRightLeftIcon,
  BubbleQuestionIcon,
  CheckmarkIcon,
  ChevronDownSmallIcon,
  ContrastIcon,
  DoorIcon,
  PlusLargeIcon,
  SettingsGearIcon,
} from "@/components/color-theme-select";
import type { UserProfile } from "@/data/api/schemas/user";
import {
  currentUserAtom,
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { AuthService, authRuntime } from "@/data/auth";
import { Icon } from "@/primitives/icon";
import {
  menuCheckClassName,
  menuIconClassName,
  menuTrailingClassName,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuSub,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { useSetupRestore } from "./use-setup-restore";
import { UserAvatar } from "./user-avatar";

export const createOrganizationDialogOpenAtom = Atom.make(false);

export const signOutAtom = authRuntime.fn(() =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    yield* auth.signOut;
  }),
);

export const logOut = async (deps: {
  signOut: () => Promise<unknown>;
  clearOrganization: () => void;
  goToSignIn: () => void;
}) => {
  try {
    await deps.signOut();
  } catch {
    return;
  }
  deps.clearOrganization();
  deps.goToSignIn();
};

export const userDisplayName = (
  user: Pick<UserProfile, "firstName" | "lastName" | "email">,
) =>
  [user.firstName, user.lastName]
    .flatMap((part) =>
      part === null || part.trim() === "" ? [] : [part.trim()],
    )
    .join(" ") ||
  user.email ||
  "";

export const settingsShortcutLabel = (mac: boolean) =>
  mac ? "\u2318," : "Ctrl+,";

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

export const supportMailto = (userId: string | undefined, page: string) =>
  "mailto:support@capy.ai?subject=Capy%20support&body=" +
  encodeURIComponent(
    "Diagnostic context\nUser ID: " +
      (userId ?? "unknown") +
      "\nBuild: unknown\nPage: " +
      page,
  );

export type UserMenuProps = ComponentProps<"div"> & {
  compact?: boolean;
};

export function UserMenu({ compact = false, ...props }: UserMenuProps) {
  const navigate = useNavigate();
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const selectedOrgId = useAtomValue(selectedOrgIdAtom);
  const selectOrg = useAtomSet(selectedOrgIdAtom);
  const openCreateOrganization = useAtomSet(createOrganizationDialogOpenAtom);
  const signOut = useAtomSet(signOutAtom, { mode: "promise" });
  const activeOrgId = resolveActiveOrgId(organizations, selectedOrgId);
  const activeOrg = organizations.find((org) => org.id === activeOrgId);
  const setup = useSetupRestore(activeOrgId);
  const name = user === undefined ? "" : userDisplayName(user);

  const open =
    (to: "/settings/general" | "/settings/org/usage") =>
    (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey) {
        window.open(to, "_blank");
        return;
      }
      navigate({ to });
    };

  const trigger = (
    <ResponsiveMenuTrigger
      render={
        <button
          type="button"
          aria-label={compact ? name : undefined}
          className={
            "flex cursor-pointer items-center gap-2 rounded outline-none select-none " +
            (compact ? "relative shrink-0 p-1" : "w-full p-1.5 text-left") +
            " transition-colors duration-hover hover:bg-secondary data-[popup-open]:bg-secondary focus-visible:outline-ring-inset"
          }
        />
      }
    >
      <UserAvatar src={user?.imageUrl ?? null} name={name} />
      {compact ? null : (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate text-xs font-medium text-foreground">
                {name}
              </span>
            </span>
            <span
              className="min-w-0 truncate text-2xs font-normal text-muted-foreground-2"
              title={activeOrg?.name}
            >
              {activeOrg?.name}
            </span>
          </span>
          <ChevronDownSmallIcon className="ml-auto size-(--icon-sm) shrink-0 rotate-180 text-muted-foreground-3" />
        </>
      )}
    </ResponsiveMenuTrigger>
  );

  return (
    <div {...props}>
      <ResponsiveMenu>
        {compact ? (
          <Tooltip>
            <TooltipTrigger render={trigger} />
            <TooltipContent side="top">{name}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        <ResponsiveMenuContent align="start" side="top" className="w-56">
          {setup.restorable ? (
            <ResponsiveMenuItem onClick={setup.restore}>
              <span className={menuIconClassName}>
                <Icon name="checklist" size="sm" />
              </span>
              Finish setting up
            </ResponsiveMenuItem>
          ) : null}
          <ResponsiveMenuItem onClick={open("/settings/general")}>
            <span className={menuIconClassName}>
              <SettingsGearIcon />
            </span>
            Settings
            <span className={menuTrailingClassName}>
              {settingsShortcutLabel(isMac())}
            </span>
          </ResponsiveMenuItem>
          <ResponsiveMenuItem onClick={open("/settings/org/usage")}>
            <span className={menuIconClassName}>
              <Icon name="gauge" size="sm" />
            </span>
            Usage
          </ResponsiveMenuItem>
          <ResponsiveMenuSub
            icon={<ContrastIcon />}
            label="Appearance"
            contentClassName="w-60"
          >
            <AppearanceMenuItems />
          </ResponsiveMenuSub>
          <ResponsiveMenuSub icon={<BubbleQuestionIcon />} label="Support">
            <ResponsiveMenuItem
              onClick={() =>
                window.open(
                  "https://docs.capy.ai",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <span className={menuIconClassName}>
                <Icon name="book" size="sm" />
              </span>
              Documentation
            </ResponsiveMenuItem>
            <ResponsiveMenuItem
              onClick={() =>
                window.open(
                  supportMailto(
                    user?.id,
                    window.location.origin + window.location.pathname,
                  ),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <span className={menuIconClassName}>
                <Icon name="mailbox" size="sm" />
              </span>
              Contact us
            </ResponsiveMenuItem>
            <ResponsiveMenuItem>
              <span className={menuIconClassName}>
                <Icon name="megaphone" size="sm" />
              </span>
              Send feedback
            </ResponsiveMenuItem>
          </ResponsiveMenuSub>
          <ResponsiveMenuSeparator />
          <ResponsiveMenuSub
            icon={<ArrowsRepeatRightLeftIcon />}
            label="Switch organization"
          >
            {organizations.map((org) => (
              <ResponsiveMenuItem
                key={org.id}
                onClick={() => selectOrg(org.id)}
              >
                <span className={menuIconClassName}>
                  <UserAvatar src={org.avatarUrl} name={org.name} size="xs" />
                </span>
                {org.name}
                {org.id === activeOrgId ? (
                  <CheckmarkIcon className={`ml-auto ${menuCheckClassName}`} />
                ) : null}
              </ResponsiveMenuItem>
            ))}
            <ResponsiveMenuSeparator />
            <ResponsiveMenuItem onClick={() => openCreateOrganization(true)}>
              <span className={menuIconClassName}>
                <PlusLargeIcon />
              </span>
              Create or join organization
            </ResponsiveMenuItem>
          </ResponsiveMenuSub>
          <ResponsiveMenuItem
            intent="danger"
            onClick={() =>
              logOut({
                signOut: () => signOut(),
                clearOrganization: () => selectOrg(null),
                goToSignIn: () => navigate({ to: "/sign-in" }),
              })
            }
          >
            <span className={menuIconClassName}>
              <DoorIcon />
            </span>
            Log out
          </ResponsiveMenuItem>
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    </div>
  );
}
