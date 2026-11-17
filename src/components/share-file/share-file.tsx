import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { type ReactNode, useEffect, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { CapyLogo, CapyMark } from "@/components/capy-logo";
import { Markdown } from "@/components/markdown";
import {
  driveShareIdOf,
  type ShareChange,
  ShareOsIcon,
  SharePanel,
  useShareActions,
} from "@/components/share-popover";
import type { DriveShareId } from "@/data/api/schemas/drive";
import { OrgId } from "@/data/api/schemas/ids";
import { currentUserAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  decodeShareView,
  documentTitleOf,
  formatBytes,
  isBinaryText,
  isImage,
  isRenderable,
  type ShareMember,
  type ShareView,
  shareByline,
} from "./share-view";

const track = (owner: string) => `shared/drive/share-file.tsx#${owner}`;

const value = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

const failed = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isFailure(result) && Option.isNone(AsyncResult.value(result));

export const publicShareAtom = Atom.family((shareId: DriveShareId) =>
  ApiClient.query("volumes", "publicShare", {
    params: { shareId },
    timeToLive: "1 minute",
  }),
);

export const memberShareAtom = Atom.family((shareId: DriveShareId) =>
  ApiClient.query("volumes", "readShare", {
    params: { shareId },
    reactivityKeys: [`drive-share-view:${shareId}`],
    timeToLive: "1 minute",
  }),
);

export const memberDriveTarget = (member: ShareMember) => {
  if (member.captainJamId !== null)
    return {
      to: "/drive/captain/$jamId" as const,
      params: { jamId: member.captainJamId },
    };
  if (member.automationId !== null)
    return {
      to: "/automation/$automationId/drive" as const,
      params: { automationId: member.automationId },
    };
  if (member.projectId !== null)
    return {
      to: "/project/$projectId/drive/$scope" as const,
      params: {
        projectId: member.projectId,
        scope: member.userId === null ? "shared" : "personal",
      },
    };
  return {
    to: "/drive/$scope" as const,
    params: { scope: member.userId === null ? "organization" : "personal" },
  };
};

export interface ShareShellProps {
  readonly inApp?: boolean;
  readonly inPane?: boolean;
  readonly title?: ReactNode;
  readonly byline?: string;
  readonly trailing?: ReactNode;
  readonly children: ReactNode;
}

export function ShareShell({
  inApp = false,
  inPane = false,
  title,
  byline,
  trailing,
  children,
}: ShareShellProps) {
  if (inApp)
    return (
      <div className="flex h-full min-h-0 flex-col">
        {inPane ? (
          <div className="flex min-h-10 shrink-0 items-center gap-2 border-b-hairline border-border-1 px-3 text-sm">
            <div className="min-w-0 flex-1 truncate">
              {title ?? "Shared file"}
            </div>
            <div className="flex shrink-0 items-center gap-1">{trailing}</div>
          </div>
        ) : (
          <AppTopBar className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-hairline border-border-1 bg-panel px-2">
            <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
              {title ?? "Shared file"}
            </h1>
            {trailing !== undefined && (
              <div className="ml-auto flex items-center gap-1.5 pl-2">
                {trailing}
              </div>
            )}
          </AppTopBar>
        )}
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  return (
    <div className="flex h-dvh flex-col bg-background pt-(--safe-top)">
      <header className="flex min-h-11 shrink-0 items-center gap-3 border-b-hairline border-border-1 px-3">
        <a
          data-track-owner={track("ShareShell:a[Made with Capy]")}
          href="https://capy.ai"
          aria-label="Made with Capy"
          className="flex shrink-0"
        >
          <CapyLogo className="h-4 max-sm:hidden" />
          <CapyMark className="h-5 sm:hidden" />
        </a>
        <div className="flex min-w-0 flex-1 flex-col py-1.5 sm:flex-row sm:items-center sm:gap-2 sm:py-0">
          {title}
          {byline === undefined ? null : (
            <span className="min-w-0 truncate text-xs font-normal text-muted-foreground-2">
              {byline}
            </span>
          )}
        </div>
        {trailing === undefined ? null : (
          <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
        )}
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

export interface ShareMessageProps {
  readonly line: string;
  readonly sub?: string;
  readonly action?: ReactNode;
}

export function ShareMessage({ line, sub, action }: ShareMessageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium text-foreground">{line}</p>
      {sub === undefined ? null : (
        <p className="max-w-sm text-xs text-muted-foreground-2">{sub}</p>
      )}
      {action === undefined ? null : <div className="pt-2">{action}</div>}
    </div>
  );
}

export function ShareLoading({
  inline = false,
  ...shell
}: Omit<ShareShellProps, "children"> & { readonly inline?: boolean }) {
  const body = (
    <div className="grid flex-1 place-items-center p-4">
      <span
        role="status"
        aria-label="Loading file"
        className="size-(--icon-sm) animate-spin rounded-full border-2 border-border-2 border-t-muted-foreground-2"
      />
    </div>
  );
  return inline ? body : <ShareShell {...shell}>{body}</ShareShell>;
}

export interface ShareControlProps {
  readonly view: ShareView;
  readonly member: ShareMember;
  readonly onChanged: (change: ShareChange) => void;
  readonly compact?: boolean;
}

export function ShareControl({
  view,
  member,
  onChanged,
  compact = false,
}: ShareControlProps) {
  const [open, setOpen] = useState(false);
  const share = {
    id: view.id,
    url: view.url,
    visibility: view.visibility,
    createdBy: view.authorName,
    manageable: member.manageable,
  };
  const actions = useShareActions(
    [share],
    (change) => {
      if (change === "removed") setOpen(false);
      onChanged(change);
    },
    OrgId.make(member.orgId),
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          data-track-owner={track("ShareControl:TooltipTrigger.1")}
          render={
            <PopoverTrigger
              data-track-owner={track("ShareControl:PopoverTrigger.1")}
              render={
                <Button
                  data-track-owner={track("ShareControl:Button[Share]")}
                  type="button"
                  variant="ghost"
                  intent="accent"
                  size={compact ? "icon-xs" : "sm"}
                  aria-label="Share"
                >
                  <ShareOsIcon className="size-(--icon-sm)" />
                  {compact ? null : "Share"}
                </Button>
              }
            />
          }
        />
        <TooltipContent side="bottom">Share</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="flex w-80 flex-col gap-3">
        <SharePanel
          share={{ ...share, visibility: actions.visibilityOf(share) }}
          pending={actions.pendingOf(share)}
          removing={actions.removing}
          onVisibility={(visibility) =>
            actions.setVisibility(share, visibility)
          }
          onRemove={() => actions.remove(share)}
        />
      </PopoverContent>
    </Popover>
  );
}

const download = (view: ShareView, name: string) => {
  const href =
    view.file.type === "url"
      ? view.file.url
      : URL.createObjectURL(
          new Blob([view.file.content], { type: "text/plain;charset=utf-8" }),
        );
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  if (view.file.type === "text") URL.revokeObjectURL(href);
};

function ShareBody({
  view,
  name,
  rendered,
}: {
  readonly view: ShareView;
  readonly name: string;
  readonly rendered: boolean;
}) {
  const file = view.file;
  let content: ReactNode;
  if (file.type === "url") {
    content = isImage(name) ? (
      <div className="grid flex-1 place-items-center p-4">
        <img src={file.url} alt={name} className="max-h-full max-w-full" />
      </div>
    ) : (
      <ShareMessage line="No preview" sub={formatBytes(view.sizeBytes)} />
    );
  } else if (isBinaryText(file.content)) {
    content = (
      <ShareMessage line="No preview" sub={formatBytes(view.sizeBytes)} />
    );
  } else if (rendered && /\.(md|markdown|mdx)$/i.test(name)) {
    content = (
      <div className="mx-auto w-full max-w-3xl px-6 py-6">
        <Markdown text={file.content} />
      </div>
    );
  } else {
    content = (
      <pre className="min-w-0 flex-1 overflow-auto px-6 py-4 font-mono text-xs text-foreground">
        {file.content}
      </pre>
    );
  }
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-card">
      {content}
    </section>
  );
}

export interface ShareViewerProps {
  readonly view: ShareView;
  readonly inApp?: boolean;
  readonly inPane?: boolean;
  readonly trailing?: ReactNode;
  readonly onShareChanged: (change: ShareChange) => void;
}

export function ShareViewer({
  view,
  inApp = false,
  inPane = false,
  trailing,
  onShareChanged,
}: ShareViewerProps) {
  const navigate = useNavigate();
  const [rendered, setRendered] = useState(true);
  const name = view.path.split("/").at(-1) ?? view.path;
  const title =
    documentTitleOf(
      name,
      view.file.type === "text" ? view.file.content : undefined,
    ) ?? name;
  const member = view.member;
  useEffect(() => {
    if (inPane) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [inPane, title]);

  if (inPane)
    return (
      <ShareShell
        inApp
        inPane
        title={view.path}
        trailing={
          member === null ? (
            trailing
          ) : (
            <>
              <Button
                data-track-owner={track(
                  "ShareViewer:ResponsiveMenuItem[Open in Drive]",
                )}
                variant="ghost"
                size="xs"
                onClick={() =>
                  void navigate({
                    ...memberDriveTarget(member),
                    search: { file: view.path },
                  })
                }
              >
                Open in Drive
              </Button>
              <ShareControl
                view={view}
                member={member}
                onChanged={onShareChanged}
                compact
              />
            </>
          )
        }
      >
        <ShareBody view={view} name={name} rendered={rendered} />
      </ShareShell>
    );

  const menu = (
    <Menu>
      <MenuTrigger
        data-track-owner={track("ShareViewer:ResponsiveMenuTrigger.1")}
        render={
          <Button
            data-track-owner={track("ShareViewer:Button.1")}
            variant="ghost"
            size="sm"
            className="-ml-2.5 inline-flex min-w-0 max-w-full items-center gap-1 text-sm font-medium md:-ml-2"
            aria-label={`${title}, file options`}
          />
        }
      >
        <span className="min-w-0 truncate">{title}</span>
        <Icon
          name="chevron-grabber-vertical"
          size="sm"
          className="shrink-0 text-muted-foreground-3"
        />
      </MenuTrigger>
      <MenuContent align="start" className="w-64">
        <MenuLabel className="truncate">{view.path}</MenuLabel>
        <MenuSeparator />
        {isRenderable(name) && (
          <MenuItem
            data-track-owner={track("ShareViewer:ResponsiveMenuItem.1")}
            onClick={() => setRendered(!rendered)}
          >
            <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
              <Icon name={rendered ? "code-brackets" : "file-text"} size="sm" />
            </span>
            {rendered
              ? "View source"
              : isImage(name)
                ? "View image"
                : "View rendered"}
          </MenuItem>
        )}
        <MenuItem
          data-track-owner={track("ShareViewer:ResponsiveMenuItem[Download]")}
          onClick={() => download(view, name)}
        >
          <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
            <Icon name="cloud-simple-download" size="sm" />
          </span>
          Download
        </MenuItem>
      </MenuContent>
    </Menu>
  );

  return (
    <ShareShell
      inApp={inApp}
      title={menu}
      byline={shareByline(view)}
      trailing={
        member === null ? (
          trailing
        ) : (
          <ShareControl
            view={view}
            member={member}
            onChanged={onShareChanged}
          />
        )
      }
    >
      <ShareBody view={view} name={name} rendered={rendered} />
    </ShareShell>
  );
}

function MemberRedirect({
  member,
  path,
}: {
  readonly member: ShareMember;
  readonly path: string;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({
      ...memberDriveTarget(member),
      search: { file: path },
      replace: true,
    });
  }, [member, path, navigate]);
  return <ShareLoading />;
}

export interface ShareFileProps {
  readonly shareId: string;
  readonly preview?: boolean;
  readonly inApp?: boolean;
  readonly inPane?: boolean;
}

export function ShareFile({
  shareId,
  preview = false,
  inApp = false,
  inPane = false,
}: ShareFileProps) {
  const navigate = useNavigate();
  const user = useAtomValue(currentUserAtom);
  const isLoaded = !AsyncResult.isInitial(user) || value(user) !== undefined;
  const isSignedIn = value(user) !== undefined;
  const viewId = driveShareIdOf(shareId);
  const publicAtom = publicShareAtom(viewId ?? ("" as DriveShareId));
  const memberAtom = memberShareAtom(viewId ?? ("" as DriveShareId));
  const publicResult = useAtomValue(publicAtom);
  const memberResult = useAtomValue(memberAtom);
  const retryPublic = useAtomRefresh(publicAtom);
  const retryMember = useAtomRefresh(memberAtom);
  const [removed, setRemoved] = useState(false);

  const memberView =
    removed || !isSignedIn ? undefined : decodeShareView(value(memberResult));
  const publicView = removed ? undefined : decodeShareView(value(publicResult));
  const view = memberView ?? publicView;
  const memberFailed = failed(memberResult);
  const publicFailed = failed(publicResult);

  const signIn = () =>
    void navigate({
      href: `/sign-in?${new URLSearchParams({ redirect_url: window.location.href })}`,
    });
  const trailing =
    isLoaded && !isSignedIn ? (
      <Button
        data-track-owner={track("ShareFile:Button[Sign in]")}
        variant="ghost"
        size="sm"
        onClick={signIn}
      >
        Sign in
      </Button>
    ) : undefined;
  const shell = { inApp, inPane };

  const member = preview ? null : (memberView?.member ?? null);
  if (!inApp && memberView !== undefined && member !== null)
    return <MemberRedirect member={member} path={memberView.path} />;
  if (
    !preview &&
    !removed &&
    isLoaded &&
    isSignedIn &&
    memberView === undefined &&
    !memberFailed
  )
    return <ShareLoading {...shell} trailing={trailing} />;
  if (view !== undefined)
    return (
      <ShareViewer
        view={view}
        {...shell}
        trailing={trailing}
        onShareChanged={(change) => {
          if (change === "removed") setRemoved(true);
          retryMember();
        }}
      />
    );
  if (removed || publicFailed)
    return (
      <ShareShell {...shell} trailing={trailing}>
        <ShareMessage
          line="This link is not available"
          sub="It may have been removed, or the file is no longer in the drive"
          action={
            removed ? undefined : (
              <Button
                data-track-owner={track("ShareFile:Button[Retry]")}
                variant="outline"
                size="sm"
                onClick={retryPublic}
              >
                Retry
              </Button>
            )
          }
        />
      </ShareShell>
    );
  if (isSignedIn && !memberFailed)
    return <ShareLoading {...shell} trailing={trailing} />;
  if (publicView === undefined || !isLoaded)
    return <ShareLoading {...shell} trailing={trailing} />;
  if (isSignedIn)
    return (
      <ShareShell {...shell}>
        <ShareMessage
          line="You cannot open this link"
          sub="It is shared only with people in the organization that owns the file, or only with the person who made it"
        />
      </ShareShell>
    );
  return (
    <ShareShell {...shell}>
      <ShareMessage
        line="Sign in to open this link"
        sub="It is shared with the organization that owns the file"
        action={
          <Button
            data-track-owner={track("ShareFile:Button[Sign in].2")}
            intent="accent"
            size="sm"
            onClick={signIn}
          >
            Sign in
          </Button>
        }
      />
    </ShareShell>
  );
}

export function SharePage(props: Omit<ShareFileProps, "inPane">) {
  return <ShareFile {...props} />;
}
