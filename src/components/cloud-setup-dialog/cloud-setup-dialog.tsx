import { type ReactNode, useSyncExternalStore } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/primitives/alert";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";

export type CloudSetupRepo = { repoFullName: string; covered: boolean };

export type CloudSetupGuidance = {
  refused: "auth" | "missing" | (string & {});
  message: ReactNode;
};

export type CloudSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  repos: CloudSetupRepo[];
  userConnected: boolean;
  installed: boolean;
  guidance?: CloudSetupGuidance;
  starting: boolean;
  onConnectUser: () => void;
  onManageInstall: () => void;
};

type DevicePlatform = "darwin" | "win32" | "linux";

const deviceNouns: Record<DevicePlatform, string> = {
  darwin: "Mac",
  win32: "PC",
  linux: "computer",
};

export function devicePlatform(userAgent: string): DevicePlatform {
  if (/Mac/i.test(userAgent)) return "darwin";
  if (/Win/i.test(userAgent)) return "win32";
  return "linux";
}

export function guidanceTitle(refused: string, device: string) {
  if (refused === "auth") return `GitHub is signed out on this ${device}`;
  if (refused === "missing")
    return `GitHub CLI is not installed on this ${device}`;
  return `GitHub CLI can't answer on this ${device}`;
}

const subscribeNever = () => () => {};

function useDeviceNoun() {
  return deviceNouns[
    useSyncExternalStore(
      subscribeNever,
      () => devicePlatform(navigator.userAgent),
      () => "linux" as const,
    )
  ];
}

type StepStatus = "done" | "current" | "upcoming";

function ConnectStep({
  number,
  status,
  title,
  description,
  children,
}: {
  number: number;
  status: StepStatus;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-step-status={status}
      className="grid grid-cols-[1rem_minmax(0,1fr)] items-baseline gap-x-2 gap-y-2"
    >
      {status === "done" ? (
        <Icon name="circle-check" className="size-4 self-center text-success" />
      ) : (
        <span className="text-right text-sm text-muted-foreground-2 tabular-nums select-none">
          {number}.
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p
          className={
            status === "upcoming"
              ? "text-sm text-muted-foreground-2"
              : "text-sm"
          }
        >
          {title}
        </p>
        {description !== undefined && (
          <p className="text-xs text-muted-foreground-2">{description}</p>
        )}
      </div>
      {children !== undefined && children !== false && (
        <div className="col-start-2 flex min-w-0 flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

function RepoRow({ repo }: { repo: CloudSetupRepo }) {
  const owner = repo.repoFullName.split("/")[0] ?? repo.repoFullName;
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
        <img
          src={`https://github.com/${owner}.png?size=64`}
          alt={owner}
          className="absolute inset-0 size-full object-cover"
        />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-normal text-foreground">
        {repo.repoFullName}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground-1">
        <span
          aria-hidden
          className={`size-1.5 shrink-0 rounded-full ${repo.covered ? "bg-success" : "bg-muted-foreground-3"}`}
        />
        {repo.covered ? "Covered" : "Not covered"}
      </span>
    </div>
  );
}

function ConsoleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="size-(--icon-sm) shrink-0"
    >
      <path
        d="M7.5 8L9.25 9.75L7.5 11.5M12 11.5H14M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="size-(--icon-xs) shrink-0"
    >
      <path
        d="M18 15V6M18 6H9M18 6L6.25 17.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloudSetupDialog({
  open,
  onOpenChange,
  projectName,
  repos,
  userConnected,
  installed,
  guidance,
  starting,
  onConnectUser,
  onManageInstall,
}: CloudSetupDialogProps) {
  const device = useDeviceNoun();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {projectName === undefined
              ? "Connect GitHub"
              : `Set up cloud for ${projectName}`}
          </DialogTitle>
          <DialogDescription>
            {projectName === undefined
              ? "Unlocks cloud machines, pull request truth, checks, and Capy review"
              : "Unlocks live pull request state, checks, and Capy review"}
          </DialogDescription>
        </DialogHeader>
        <DialogBody data-spacing="relaxed" className="gap-4 py-5">
          {guidance !== undefined && (
            <Alert>
              <ConsoleIcon />
              <AlertTitle>{guidanceTitle(guidance.refused, device)}</AlertTitle>
              <AlertDescription>{guidance.message}</AlertDescription>
            </Alert>
          )}
          <ConnectStep
            number={1}
            status={userConnected ? "done" : "current"}
            title="Connect your GitHub account"
            description={
              userConnected ? undefined : "Capy acts as you on GitHub"
            }
          />
          <ConnectStep
            number={2}
            status={userConnected ? "current" : "upcoming"}
            title={
              installed
                ? "Grant the App access to these repos"
                : "Install the GitHub App"
            }
            description={
              installed ? undefined : "Turns on checks and Capy review"
            }
          >
            {userConnected && repos.length > 0 && (
              <Card rows>
                {repos.map((repo) => (
                  <RepoRow key={repo.repoFullName} repo={repo} />
                ))}
              </Card>
            )}
          </ConnectStep>
        </DialogBody>
        <DialogFooter className="items-center">
          <Button
            data-track-owner="shared/connect-layout.tsx#ConnectHelp:Button.1"
            variant="link"
            size="auto-xs"
            className="focus-gutter mr-auto"
            render={
              <a
                href="https://docs.capy.ai/integrations/github"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            GitHub guide
            <ArrowUpRightIcon />
          </Button>
          <Button
            data-track-owner="shared/connect-layout.tsx#ConnectFooter:Button[onClick=onCancel]"
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            data-track-owner={
              userConnected
                ? "shared/cloud-setup-dialog.tsx#CloudSetupDialogView:Button[onClick=onManageInstall]"
                : "shared/cloud-setup-dialog.tsx#CloudSetupDialogView:Button[Connect GitHub]"
            }
            intent="accent"
            disabled={starting}
            aria-busy={starting || undefined}
            onClick={userConnected ? onManageInstall : onConnectUser}
          >
            {starting ? (
              "Opening GitHub"
            ) : (
              <>
                <Icon name="github" size="sm" />
                {userConnected
                  ? installed
                    ? "Manage GitHub access"
                    : "Install GitHub App"
                  : "Connect GitHub"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
