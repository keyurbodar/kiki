import { useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import {
  type DriveEntry,
  type DriveScopeFiles,
  driveScopeFilesAtom,
} from "@/data/atoms/agent-context";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { SettingsRow } from "@/primitives/settings-row";
import {
  SideSheet,
  SideSheetContent,
  SideSheetDescription,
  SideSheetHeader,
  SideSheetTitle,
} from "@/primitives/side-sheet";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { AgentContextPreview } from "../agent-context-preview";
import {
  type AgentScope,
  DraftEditor,
  EditorSkeleton,
  LoadedEditor,
  ProjectMenu,
  resultValue,
  useAgentScopes,
  useVolumeFile,
  useVolumeWriter,
} from "../agent-scopes";

/** Characters a thread reads from one instructions file. */
export const instructionsCap = 32_000;

const agentsFile = "AGENTS.md";
const crewFile = "CREW.md";

/** Capy's one-line summary of a markdown file: its first non-empty, non-rule line, unmarked. */
export const firstLine = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[#>*\-\s]+/, "").trim())
    .find((line) => line !== "" && !line.startsWith("---"));

const artifactsDigest = (files: DriveScopeFiles | undefined) =>
  files?.volumes.find((volume) => volume.namespace === "artifacts")
    ?.headDigest ?? null;

function ScopeFileSummary({ entry }: { entry: DriveEntry }) {
  const { content, failed } = useVolumeFile(entry);
  if (content === undefined)
    return failed ? (
      <span className="block truncate">Could not load this file</span>
    ) : (
      <SkeletonPanel className="h-3 w-48" />
    );
  return (
    <span className="block truncate">
      {content.kind === "text"
        ? (firstLine(content.text) ?? "Empty")
        : "Not a text file"}
    </span>
  );
}

type LiveFiles = {
  entries: ReadonlyArray<DriveEntry>;
  headDigest: string | null;
};

function ScopeFileSheet({
  file,
  live,
  onClose,
}: {
  file: AgentScope;
  live: LiveFiles | undefined;
  onClose: () => void;
}) {
  const [path, setPath] = useState(agentsFile);
  const [opened, setOpened] = useState(live);
  if (opened === undefined && live !== undefined) setOpened(live);
  const entry = opened?.entries.find((candidate) => candidate.path === path);
  const liveEntry = live?.entries.find((candidate) => candidate.path === path);
  const writer = useVolumeWriter({
    scope: file.scope,
    headDigest: opened?.headDigest ?? null,
    onReload: () => setOpened(live),
  });
  const crewRules = file.captain !== undefined && path === crewFile;
  const title =
    file.captain === undefined
      ? file.title
      : crewRules
        ? `${file.captain} crew rules`
        : `${file.captain} instructions`;
  const audience =
    file.captain === undefined
      ? file.audience
      : crewRules
        ? `Every crew thread of ${file.captain} follows these`
        : `What ${file.captain} itself follows`;
  const editor = {
    path,
    placeholder: "Write instructions in markdown",
    cap: instructionsCap,
    readOnly: file.readOnly === true,
    changed: live !== undefined && liveEntry?.sha256 !== entry?.sha256,
    onReload: () => setOpened(live),
    onSave: (content: string) =>
      writer.put(
        [{ path, content }],
        "Instructions saved",
        "Could not save instructions",
      ),
    onSaved: onClose,
  };
  return (
    <SideSheet open onOpenChange={(open) => !open && onClose()}>
      <SideSheetContent aria-label={title}>
        <SideSheetHeader>
          <SideSheetTitle>{title}</SideSheetTitle>
          <SideSheetDescription>{audience}</SideSheetDescription>
        </SideSheetHeader>
        {file.captain !== undefined && (
          // biome-ignore lint/a11y/useSemanticElements: Capy's toggle group is a div with role group
          <div className="flex gap-1 px-5 pt-4" role="group" aria-label="File">
            {[
              { value: agentsFile, label: "Captain" },
              { value: crewFile, label: "Crew rules" },
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                size="sm"
                data-selected={path === option.value || undefined}
                aria-pressed={path === option.value}
                onClick={() => setPath(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}
        {opened === undefined ? (
          <EditorSkeleton />
        ) : entry === undefined ? (
          <DraftEditor key={path} initial="" {...editor} />
        ) : (
          <LoadedEditor
            key={`${path}:${entry.sha256}`}
            entry={entry}
            {...editor}
          />
        )}
      </SideSheetContent>
    </SideSheet>
  );
}

function ScopeFileRow({
  file,
  open,
  onOpenChange,
}: {
  file: AgentScope;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const files = resultValue(useAtomValue(driveScopeFilesAtom(file.filtersKey)));
  const entry = files?.entries.find(
    (candidate) => candidate.path === agentsFile,
  );
  return (
    <>
      <SettingsRow
        icon={file.icon}
        label={
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate">{file.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground-2">
              {file.kind}
            </span>
          </span>
        }
        description={
          entry === undefined || entry.sizeBytes === 0 ? (
            <span className="text-muted-foreground-3">Empty</span>
          ) : (
            <ScopeFileSummary entry={entry} />
          )
        }
        highlighted={open}
        onClick={() => onOpenChange(true)}
      >
        <Icon
          name="chevron-right-small"
          className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
        />
      </SettingsRow>
      {open && (
        <ScopeFileSheet
          file={file}
          live={
            files === undefined
              ? undefined
              : { entries: files.entries, headDigest: artifactsDigest(files) }
          }
          onClose={() => onOpenChange(false)}
        />
      )}
    </>
  );
}

/** Capy's Instructions settings page. */
export function InstructionsPage() {
  const { projects, project, setProjectId, scopes } = useAgentScopes();
  const [openKey, setOpenKey] = useState<string>();
  return (
    <SettingsPage
      title="Instructions"
      description="What Capy follows in every thread"
    >
      <SettingsSection
        id="instructions-files"
        title="Files"
        description="Open one to edit it"
        action={
          projects.length > 1 && project !== undefined ? (
            <ProjectMenu
              projects={projects}
              value={project}
              onChange={setProjectId}
            />
          ) : undefined
        }
      >
        <Card rows>
          {scopes.map((file) => (
            <ScopeFileRow
              key={file.key}
              file={file}
              open={openKey === file.key}
              onOpenChange={(open) => setOpenKey(open ? file.key : undefined)}
            />
          ))}
        </Card>
      </SettingsSection>
      {project !== undefined && (
        <AgentContextPreview project={project} scopes={scopes} />
      )}
    </SettingsPage>
  );
}
