import {
  type ErrorComponentProps,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type ReactNode,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import capySleeping from "./assets/capy-sleeping.webp";
import {
  CrashReportContext,
  capyDesktop,
  formatCrashReport,
  shouldHardReload,
  withLogTail,
} from "./crash-report";

export type Crash = {
  title: string;
  summary: ReactNode;
  report: string;
  logTail?: () => Promise<string[]>;
};

const noopSubscribe = () => () => {};

export function useIsDesktopApp() {
  return useSyncExternalStore(
    noopSubscribe,
    () => capyDesktop() !== undefined,
    () => false,
  );
}

export type SurfaceCardProps = {
  title: ReactNode;
  summary: ReactNode;
  actions: ReactNode;
  details?: ReactNode;
};

export function SurfaceCard({
  title,
  summary,
  actions,
  details,
}: SurfaceCardProps) {
  return (
    <div className="relative min-w-0 w-full max-w-md pt-9">
      <Card className="relative">
        <div className="flex flex-col gap-3 p-5">
          <h1 className="text-base font-medium text-foreground">{title}</h1>
          <p className="text-sm leading-relaxed font-normal text-muted-foreground-1">
            {summary}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {actions}
          </div>
          {details}
        </div>
      </Card>
      <img
        aria-hidden
        alt=""
        src={capySleeping}
        width={108}
        height={48}
        className="pointer-events-none absolute top-0 right-5 h-12 w-auto select-none"
      />
    </div>
  );
}

export function SupportLink() {
  return (
    <a
      className="text-(--text-link) hover:underline underline-offset-2"
      href="mailto:support@capy.ai"
    >
      support@capy.ai
    </a>
  );
}

export type CrashCardProps = {
  crash: Crash;
  onReload: () => void;
  onExportLogs?: () => void;
};

export function CrashCard({ crash, onReload, onExportLogs }: CrashCardProps) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    (crash.logTail?.().catch(() => undefined) ?? Promise.resolve(undefined))
      .then((lines) =>
        navigator.clipboard.writeText(withLogTail(crash.report, lines)),
      )
      .then(() => setCopied(true));
  };
  return (
    <SurfaceCard
      title={crash.title}
      summary={
        <>
          {crash.summary} If it keeps happening, reach out to <SupportLink />
        </>
      }
      actions={
        <>
          <Button variant="solid" intent="accent" size="sm" onClick={onReload}>
            Reload Capy
          </Button>
          <Button variant="soft" size="sm" onClick={copy}>
            {copied ? "Copied" : "Copy report"}
          </Button>
          {onExportLogs === undefined ? null : (
            <Button variant="ghost" size="sm" onClick={onExportLogs}>
              Export logs
            </Button>
          )}
        </>
      }
      details={
        <pre className="max-h-64 overflow-auto rounded-(--radius-inner) bg-secondary p-3 font-mono text-xs whitespace-pre-wrap text-muted-foreground-1 [overflow-wrap:anywhere]">
          {crash.report}
        </pre>
      }
    />
  );
}

export function CrashScreen({ crash, onReload, onExportLogs }: CrashCardProps) {
  const desktop = useIsDesktopApp();
  return (
    <main className="relative grid h-dvh grid-cols-1 place-items-center overflow-y-auto bg-background px-6 pt-(--safe-top) pb-(--safe-bottom)">
      {desktop ? (
        <div
          aria-hidden
          className="desktop-drag-region absolute inset-x-0 top-0 h-10"
        />
      ) : null}
      <CrashCard
        crash={crash}
        onReload={onReload}
        onExportLogs={onExportLogs}
      />
    </main>
  );
}

type CrashErrorProps = Partial<Pick<ErrorComponentProps, "error" | "info">>;

const DEPLOYMENT: string = import.meta.env.MODE;
const COMMIT: string = import.meta.env.VITE_COMMIT_SHA ?? "unknown";

export function useCrashReport({ error, info }: CrashErrorProps) {
  const context = useContext(CrashReportContext);
  const [initialContext] = useState(context);
  const [route] = useState(
    () =>
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
  const [time] = useState(() => new Date().toISOString());
  return formatCrashReport({
    error,
    componentStack: info?.componentStack ?? undefined,
    route,
    time,
    context: initialContext,
    deployment: DEPLOYMENT,
    commit: COMMIT,
    desktopVersion: capyDesktop()?.appVersion,
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    pathname: window.location.pathname,
  });
}

const reloadAttempts = new Map<string, number>();

export function useCrashReload({
  error,
  reset,
}: Partial<Pick<ErrorComponentProps, "error" | "reset">>) {
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });
  return () => {
    const now = performance.now();
    if (shouldHardReload(error, reloadAttempts.get(pathname), now)) {
      window.location.reload();
      return;
    }
    reloadAttempts.set(pathname, now);
    void router.invalidate();
    reset?.();
  };
}

export type CrashSurfaceProps = ComponentProps<"div"> &
  Partial<ErrorComponentProps>;

export function CrashSurface({
  error,
  info,
  reset,
  className,
  ...props
}: CrashSurfaceProps) {
  const report = useCrashReport({ error, info });
  const onReload = useCrashReload({ error, reset });
  return (
    <div
      {...props}
      className={cx(
        "grid size-full min-h-64 grid-cols-1 place-items-center overflow-y-auto p-6",
        className,
      )}
    >
      <CrashCard
        crash={{
          title: "Something went wrong",
          summary:
            "This page stopped rendering. Reload to continue, other tabs are unaffected.",
          report,
          logTail: capyDesktop()?.diagnostics?.logTail,
        }}
        onReload={onReload}
      />
    </div>
  );
}

export function AppCrashSurface({ error, info, reset }: ErrorComponentProps) {
  const report = useCrashReport({ error, info });
  const onReload = useCrashReload({ error, reset });
  return (
    <CrashScreen
      crash={{
        title: "Something went wrong",
        summary: "The app stopped rendering. Reload to continue.",
        report,
        logTail: capyDesktop()?.diagnostics?.logTail,
      }}
      onReload={onReload}
    />
  );
}
