import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { CommandMenuCompose } from "@/components/command-menu-compose";
import { CommandMenuProject } from "@/components/command-menu-project";
import {
  CommandMenuSearch,
  type OpenTarget,
  PaletteFooter,
  paletteBodyClass,
  paletteContentClass,
  paletteOverlayClass,
  palettePositionerClass,
} from "@/components/command-menu-search";
import type { Project } from "@/data/api/schemas/project";
import type { ThreadCardPage } from "@/data/api/schemas/thread";
import { reactivityKeys } from "@/data/atoms/conventions";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import { threadsAtom } from "@/data/atoms/threads";
import { ApiClient } from "@/data/client/ApiClient";
import {
  type CommandPaletteOpenDetail,
  useCommandPaletteOpen,
} from "@/lib/command-palette-events";
import { CommandMenuDialog } from "@/primitives/command-menu";
import { PaletteCapyMark } from "./capy-mark";
import {
  buildSearchData,
  type PaletteSearchSource,
  sampleSearchSource,
  sourceFromAtoms,
} from "./search-source";

const createThreadAtom = ApiClient.mutation("jams", "createProjectless");
const createProjectAtom = ApiClient.mutation("projects", "create");

const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

export type PaletteView =
  | { kind: "search" }
  | { kind: "compose"; from: "direct" | "root"; seed: string }
  | { kind: "project"; from: "direct" | "root" };

export const viewForIntent = (intent: string | null): PaletteView =>
  intent === "project"
    ? { kind: "project", from: "direct" }
    : intent === "compose"
      ? { kind: "compose", from: "direct", seed: "" }
      : { kind: "search" };

export const isPaletteToggle = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  event.key.toLowerCase() === "k";

export const openTargetPath = (target: OpenTarget) => {
  switch (target.kind) {
    case "thread":
      return "/thread/" + target.thread.id;
    case "captain":
      return "/thread/" + target.captain.id + "?pane=chat";
    case "pull": {
      const [owner = "", repo = target.pull.repo] = target.pull.repo.split("/");
      return "/pull/" + owner + "/" + repo + "/" + target.pull.number;
    }
    case "automation":
      return "/automation/" + target.automation.id;
  }
};

function PaletteFrameFooter({ children }: { children: ReactNode }) {
  return (
    <PaletteFooter className="max-md:hidden">
      <PaletteCapyMark className="h-4 text-muted-foreground-3" />
      <span className="ml-auto flex items-center gap-4">{children}</span>
    </PaletteFooter>
  );
}

const frameFooter = (hints: ReactNode) => (
  <PaletteFrameFooter>{hints}</PaletteFrameFooter>
);

export type CommandPaletteHostProps = {
  source?: PaletteSearchSource;
  defaultOpen?: boolean;
};

/**
 * The palette host mounts in the shell on every route, so reading these with an
 * empty org id would fire two requests that cannot succeed on each mount. Until
 * the org is known they are initial results, which every reader already treats
 * as "not loaded".
 */
const idleThreadPage: Atom.Atom<
  AsyncResult.AsyncResult<ThreadCardPage, unknown>
> = Atom.make(AsyncResult.initial(false));
const idleProjects: Atom.Atom<
  AsyncResult.AsyncResult<readonly Project[], unknown>
> = Atom.make(AsyncResult.initial(false));

export function CommandPaletteHost({
  source,
  defaultOpen = false,
}: CommandPaletteHostProps) {
  const router = useRouter();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [open, setOpen] = useState(defaultOpen);
  const [view, setView] = useState<PaletteView>({ kind: "search" });
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >();
  const organizations = useAtomValue(organizationsAtom);
  const orgId = resultValue(organizations)?.[0]?.id;
  const threadsForOrg: Atom.Atom<
    AsyncResult.AsyncResult<ThreadCardPage, unknown>
  > = orgId === undefined ? idleThreadPage : threadsAtom(orgId);
  const projectsForOrg: Atom.Atom<
    AsyncResult.AsyncResult<readonly Project[], unknown>
  > = orgId === undefined ? idleProjects : projectsAtom(orgId);
  const threadsResult = useAtomValue(threadsForOrg);
  const projectsResult = useAtomValue(projectsForOrg);
  const orgThreads = resultValue(threadsResult)?.items ?? [];
  const orgProjects = resultValue(projectsResult) ?? [];
  const createThread = useAtomSet(createThreadAtom, { mode: "promise" });
  const createProject = useAtomSet(createProjectAtom, { mode: "promise" });
  const atomSource = useMemo(
    () => sourceFromAtoms(orgThreads, orgProjects, now),
    [orgThreads, orgProjects, now],
  );
  const searchSource =
    source ?? (orgId === undefined ? sampleSearchSource(now) : atomSource);
  const projects = searchSource.projects;
  const project =
    projects.find((candidate) => candidate.id === selectedProjectId) ??
    projects[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isPaletteToggle(event)) return;
      event.preventDefault();
      setView({ kind: "search" });
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useCommandPaletteOpen(
    useCallback((detail: CommandPaletteOpenDetail) => {
      setView(viewForIntent(detail.intent));
      setOpen(true);
    }, []),
  );

  const close = () => setOpen(false);

  const go = (path: string, options?: { newTab: boolean }) => {
    if (options?.newTab === true) window.open(path, "_blank");
    else router.history.push(path);
  };

  const data = buildSearchData(
    searchSource,
    {
      go,
      compose: () => setView({ kind: "compose", from: "root", seed: "" }),
      project: () => setView({ kind: "project", from: "root" }),
      copyUrl: () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(
          () => toast.success("Link copied", { description: url }),
          () => toast.error("Could not copy link"),
        );
      },
    },
    pathname,
  );

  const backToSearch = () => setView({ kind: "search" });

  return (
    <CommandMenuDialog open={open} onOpenChange={setOpen}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          data-slot="dialog-overlay"
          className={paletteOverlayClass}
        />
        <div className={palettePositionerClass}>
          <BaseDialog.Popup
            data-slot="command-menu-content"
            aria-label="Command menu"
            initialFocus={false}
            className={paletteContentClass}
          >
            <div data-slot="command-menu" className={paletteBodyClass}>
              {view.kind === "compose" ? (
                <CommandMenuCompose
                  from={view.from}
                  defaultText={view.seed}
                  projects={projects}
                  project={project}
                  onProjectChange={(next) => setSelectedProjectId(next.id)}
                  onBack={view.from === "direct" ? close : backToSearch}
                  onSubmit={({ text, title, projectId }) => {
                    if (orgId === undefined)
                      return Promise.reject(new Error("No organization"));
                    return createThread({
                      params: { orgId },
                      payload: {
                        text,
                        title,
                        projectId,
                        modelChoice: { modelId: "claude-sonnet-4-6" },
                      },
                      reactivityKeys: [reactivityKeys.threads(orgId)],
                    }).then(() => {
                      close();
                      router.history.push("/threads");
                    });
                  }}
                  footer={frameFooter}
                />
              ) : view.kind === "project" ? (
                <CommandMenuProject
                  from={view.from}
                  repos={searchSource.repos}
                  machines={searchSource.machines}
                  onBack={view.from === "direct" ? close : backToSearch}
                  onCreate={({ name }) => {
                    if (orgId === undefined)
                      return Promise.reject(new Error("No organization"));
                    return createProject({
                      params: { orgId },
                      payload: { name },
                      reactivityKeys: [reactivityKeys.projects(orgId)],
                    }).then(() => close());
                  }}
                  footer={frameFooter}
                />
              ) : (
                <CommandMenuSearch
                  data={data}
                  now={now}
                  initialQuery={query}
                  close={close}
                  onCompose={({ query: text, seed }) => {
                    setQuery(text);
                    setView({ kind: "compose", from: "root", seed });
                  }}
                  onOpen={(target, options) =>
                    go(openTargetPath(target), options)
                  }
                  footer={frameFooter}
                />
              )}
            </div>
          </BaseDialog.Popup>
        </div>
      </BaseDialog.Portal>
    </CommandMenuDialog>
  );
}
