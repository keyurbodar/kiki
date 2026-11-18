import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import {
  PaletteHint,
  PaletteInput,
  PaletteItem,
  paletteEmptyClass,
  paletteGroupClass,
  paletteGroupLabelClass,
  paletteItemIconClass,
  paletteItemTrailingClass,
  paletteListClass,
  paletteStatusLineClass,
} from "@/components/command-menu-search";
import { HighlightedText, matchText } from "@/components/filter-search";
import {
  CommandMenu,
  CommandMenuGroup,
  CommandMenuGroupLabel,
  CommandMenuList,
} from "@/primitives/command-menu";
import { Icon } from "@/primitives/icon";
import { toast } from "@/primitives/toaster";

export type ProjectRepo = { fullName: string };

export type ProjectMachine = { id: string; name: string };

export type ProjectSource =
  | { kind: "github"; repos: ReadonlyArray<string> }
  | { kind: "url"; url: string }
  | {
      kind: "folder";
      machine: { kind: "this" } | { kind: "device"; device: ProjectMachine };
    }
  | { kind: "empty" };

export type ProjectStep =
  | { kind: "sources" }
  | { kind: "github" }
  | { kind: "machine" }
  | { kind: "url" }
  | { kind: "details"; source: ProjectSource }
  | { kind: "busy"; label: string };

export type ProjectCreateRequest = { source: ProjectSource; name: string };

export type CommandMenuProjectProps = ComponentProps<"div"> & {
  mode?: "create" | "add";
  repos?: ReadonlyArray<ProjectRepo>;
  machines?: ReadonlyArray<ProjectMachine>;
  installation?: string;
  desktop?: boolean;
  deviceKind?: string;
  from?: "direct" | "root";
  onCreate?: (request: ProjectCreateRequest) => Promise<unknown> | undefined;
  onBack?: () => void;
  footer?: (hints: ReactNode) => ReactNode;
};

export const projectPlaceholders: Record<ProjectStep["kind"], string> = {
  sources: "Search sources",
  machine: "Search machines",
  github: "Search repositories",
  url: "https://github.com/owner/repo",
  details: "Project name",
  busy: "",
};

const githubUrl =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i;

export const parseGithubUrl = (value: string) => {
  const found = githubUrl.exec(value.trim());
  return found === null ? undefined : `${found[1]}/${found[2]}`;
};

export const deriveProjectName = (source: ProjectSource) => {
  if (source.kind === "github") return source.repos[0]?.split("/").at(-1) ?? "";
  if (source.kind === "url")
    return parseGithubUrl(source.url)?.split("/").at(-1) ?? "";
  return "";
};

export const projectEmptyText = (step: ProjectStep["kind"]) =>
  step === "url"
    ? "Paste a GitHub URL and press Enter"
    : step === "details"
      ? "Type a project name"
      : "No results";

const matches = (query: string, label: string) =>
  query.trim() === "" || matchText(label, query) !== undefined;

export function CommandMenuProject({
  mode = "create",
  repos = [],
  machines = [],
  installation = "Pick from your installation",
  desktop = false,
  deviceKind = "device",
  from = "direct",
  onCreate,
  onBack,
  footer,
  className,
  ...props
}: CommandMenuProjectProps) {
  const creating = mode === "create";
  const [step, setStep] = useState<ProjectStep>({ kind: "sources" });
  const [query, setQuery] = useState("");

  const go = (next: ProjectStep, text = "") => {
    setStep(next);
    setQuery(text);
  };

  const toDetails = (source: ProjectSource) =>
    go({ kind: "details", source }, deriveProjectName(source));

  const create = (source: ProjectSource, name: string) => {
    if (name.trim() === "") return;
    const pending = onCreate?.({ source, name: name.trim() });
    if (pending === undefined) return;
    setStep({ kind: "busy", label: `Creating ${name.trim()}` });
    pending.catch(() => {
      toast.error("Could not create the project");
      setStep({ kind: "details", source });
    });
  };

  const back = () => {
    if (step.kind === "sources") onBack?.();
    else go({ kind: "sources" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      back();
      return;
    }
    if (event.key !== "Enter") return;
    if (step.kind === "url") {
      event.preventDefault();
      const repo = parseGithubUrl(query);
      if (repo === undefined) {
        toast.error("Enter a GitHub repository URL");
        return;
      }
      toDetails({ kind: "url", url: query.trim() });
      return;
    }
    if (step.kind === "details") {
      event.preventDefault();
      create(step.source, query);
    }
  };

  if (step.kind === "busy")
    return (
      <div
        className={["flex min-h-0 flex-col", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <div className={paletteStatusLineClass}>
          <Icon name="rotate" size="sm" className="animate-spin" />
          {step.label}
        </div>
        {footer?.(<PaletteHint keys="Esc" label="Close" />)}
      </div>
    );

  const sourceRows = [
    {
      value: "source-github",
      icon: "github" as const,
      label: "GitHub repository",
      trailing: installation,
      onClick: () => go({ kind: "github" }),
      show: true,
    },
    {
      value: "source-folder",
      icon: "folder-1" as const,
      label: "Folder on a machine",
      trailing:
        machines.length === 0 && !desktop ? "No paired machines" : undefined,
      onClick: () => go({ kind: "machine" }),
      show: true,
    },
    {
      value: "source-url",
      icon: "chain-link-2" as const,
      label: "Git URL",
      trailing: `Clone onto this ${deviceKind}`,
      onClick: () => go({ kind: "url" }),
      show: desktop,
    },
    {
      value: "source-empty",
      icon: "page-add" as const,
      label: "Empty project",
      trailing: "No repository yet",
      onClick: () => toDetails({ kind: "empty" }),
      show: creating,
    },
  ].filter((row) => row.show && matches(query, row.label));

  const machineRows = [
    ...(desktop
      ? [
          {
            id: "this",
            name: `This ${deviceKind}`,
            machine: { kind: "this" } as const,
          },
        ]
      : []),
    ...machines.map((device) => ({
      id: device.id,
      name: device.name,
      machine: { kind: "device", device } as const,
    })),
  ].filter((row) => matches(query, row.name));

  const repoRows = repos.filter((repo) => matches(query, repo.fullName));

  const footerHints = (() => {
    const escLabel =
      step.kind === "sources" && from === "direct" ? "Close" : "Back";
    switch (step.kind) {
      case "url":
        return [
          ["↵", "Clone"],
          ["Esc", "Back"],
        ];
      case "details":
        return [
          ["↵", "Create"],
          ["Esc", "Back"],
        ];
      case "github":
        return [
          ["↵", "Select"],
          ["Esc", "Back"],
        ];
      case "machine":
        return [
          ["↵", "Open"],
          ["Esc", "Back"],
        ];
      default:
        return [
          ["↵", "Open"],
          ["Esc", escLabel],
        ];
    }
  })();

  return (
    <div
      className={["flex min-h-0 flex-col", className].filter(Boolean).join(" ")}
      {...props}
    >
      <CommandMenu
        open
        mode="none"
        autoHighlight={
          step.kind === "url" || step.kind === "details" ? false : "always"
        }
        value={query}
        onValueChange={(value) => setQuery(value)}
      >
        <PaletteInput
          placeholder={projectPlaceholders[step.kind]}
          onKeyDown={onKeyDown}
        />
        <CommandMenuList className={paletteListClass}>
          <div data-slot="command-menu-empty" className={paletteEmptyClass}>
            {projectEmptyText(step.kind)}
          </div>
          {step.kind === "sources" && sourceRows.length > 0 ? (
            <CommandMenuGroup className={paletteGroupClass}>
              <CommandMenuGroupLabel className={paletteGroupLabelClass}>
                {creating ? "Where does this project live?" : "Add from"}
              </CommandMenuGroupLabel>
              {sourceRows.map((row) => (
                <PaletteItem
                  key={row.value}
                  value={row.value}
                  onClick={row.onClick}
                >
                  <span className={paletteItemIconClass}>
                    <Icon name={row.icon} />
                  </span>
                  <span className="min-w-0 truncate">{row.label}</span>
                  {row.trailing === undefined ? null : (
                    <span className={paletteItemTrailingClass}>
                      {row.trailing}
                    </span>
                  )}
                </PaletteItem>
              ))}
            </CommandMenuGroup>
          ) : null}
          {step.kind === "machine" && machineRows.length > 0 ? (
            <CommandMenuGroup className={paletteGroupClass}>
              <CommandMenuGroupLabel className={paletteGroupLabelClass}>
                Which machine has the folder?
              </CommandMenuGroupLabel>
              {machineRows.map((row) => (
                <PaletteItem
                  key={row.id}
                  value={`machine-${row.id}`}
                  onClick={() =>
                    toDetails({ kind: "folder", machine: row.machine })
                  }
                >
                  <span className={paletteItemIconClass}>
                    <Icon name="macbook" />
                  </span>
                  <span className="min-w-0 truncate">
                    <HighlightedText text={row.name} term={query.trim()} />
                  </span>
                </PaletteItem>
              ))}
            </CommandMenuGroup>
          ) : null}
          {step.kind === "github" && repoRows.length > 0 ? (
            <CommandMenuGroup className={paletteGroupClass}>
              <CommandMenuGroupLabel className={paletteGroupLabelClass}>
                GitHub
              </CommandMenuGroupLabel>
              {repoRows.map((repo) => (
                <PaletteItem
                  key={repo.fullName}
                  value={`repo-${repo.fullName}`}
                  onClick={() =>
                    toDetails({ kind: "github", repos: [repo.fullName] })
                  }
                >
                  <span className={paletteItemIconClass}>
                    <Icon name="github" />
                  </span>
                  <span className="min-w-0 truncate">
                    <HighlightedText text={repo.fullName} term={query.trim()} />
                  </span>
                </PaletteItem>
              ))}
            </CommandMenuGroup>
          ) : null}
          {step.kind === "details" && query.trim() !== "" ? (
            <PaletteItem
              value="details-create"
              onClick={() => create(step.source, query)}
            >
              <span className={paletteItemIconClass}>
                <Icon name="square-plus" />
              </span>
              <span className="min-w-0 truncate">Create {query.trim()}</span>
            </PaletteItem>
          ) : null}
        </CommandMenuList>
      </CommandMenu>
      {footer?.(
        footerHints.map(([keys = "", label = ""]) => (
          <PaletteHint key={label} keys={keys} label={label} />
        )),
      )}
    </div>
  );
}
