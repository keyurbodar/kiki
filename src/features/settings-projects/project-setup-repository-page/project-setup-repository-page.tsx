import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useParams } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  ProjectSetupRepo,
  SetupEntry,
} from "@/data/api/schemas/project-settings";
import {
  projectKey,
  projectMutations,
  projectSettingsKeys,
  projectSetupAtom,
} from "@/data/atoms/project-settings";
import { Button } from "@/primitives/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Textarea } from "@/primitives/textarea";
import { CardEmpty, CardList } from "../shared/card-list";
import { Glyph } from "../shared/glyphs";
import { useActiveOrgId } from "../shared/use-org";

export function ProjectSetupRepositoryPage() {
  const { projectId, owner, repo } = useParams({
    from: "/_app/settings/projects_/$projectId_/dev-environment_/repositories/$owner/$repo",
  });
  const orgId = useActiveOrgId();
  const repoFullName = `${owner}/${repo}`;
  return (
    <SettingsPage
      title={repoFullName}
      description="Setup scripts and commands for this repository"
    >
      {orgId === undefined ? (
        <SettingsLoadingCard />
      ) : (
        <SetupRepositoryEditor
          orgId={orgId}
          projectId={projectId}
          repoFullName={repoFullName}
        />
      )}
    </SettingsPage>
  );
}

type Draft = {
  readonly initialize: string;
  readonly refresh: string;
  readonly startup: ReadonlyArray<SetupEntry>;
  readonly commands: ReadonlyArray<SetupEntry>;
};

const draftOf = (repo: ProjectSetupRepo | undefined): Draft => ({
  initialize: repo?.scripts.initialize ?? "",
  refresh: repo?.scripts.refresh ?? "",
  startup: repo?.startup ?? [],
  commands: repo?.commands ?? [],
});

const entrySummary = (entries: ReadonlyArray<SetupEntry>, empty: string) =>
  entries.length === 0 ? empty : entries.map((entry) => entry.name).join(", ");

function SetupRepositoryEditor({
  orgId,
  projectId,
  repoFullName,
}: {
  readonly orgId: OrgId;
  readonly projectId: string;
  readonly repoFullName: string;
}) {
  const key = projectKey(orgId, projectId);
  const result = useAtomValue(projectSetupAtom(key));
  const replaceSetup = useAtomSet(projectMutations.replaceSetup, {
    mode: "promise",
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const setup = AsyncResult.isSuccess(result) ? result.value : undefined;
  const repo = setup?.repositories.find(
    (entry) => entry.repository === repoFullName,
  );
  const current = draft ?? draftOf(repo);
  const dirty =
    draft !== null &&
    (current.initialize !== (repo?.scripts.initialize ?? "") ||
      current.refresh !== (repo?.scripts.refresh ?? ""));

  if (setup === undefined)
    return (
      <CardList>
        <CardEmpty>
          {AsyncResult.isFailure(result)
            ? "Could not load the setup"
            : "Loading setup"}
        </CardEmpty>
      </CardList>
    );

  const save = () => {
    setSaving(true);
    const repositories = setup.repositories.map((entry) =>
      entry.repository === repoFullName
        ? {
            repository: entry.repository,
            branch: entry.branch,
            scripts: {
              initialize: current.initialize === "" ? null : current.initialize,
              refresh: current.refresh === "" ? null : current.refresh,
            },
            startup: entry.startup,
            commands: entry.commands,
          }
        : {
            repository: entry.repository,
            branch: entry.branch,
            scripts: entry.scripts,
            startup: entry.startup,
            commands: entry.commands,
          },
    );
    replaceSetup({
      params: { orgId, projectId },
      payload: { machineSize: setup.machineSize, repositories },
      reactivityKeys: [projectSettingsKeys.setup(orgId, projectId)],
    })
      .then(() => {
        setDraft(null);
        toast.success("Setup saved");
      })
      .catch(() => toast.error("Could not save the setup"))
      .finally(() => setSaving(false));
  };

  const setBranch = (branch: string) => {
    const repositories = setup.repositories.map((entry) =>
      entry.repository === repoFullName
        ? {
            repository: entry.repository,
            branch,
            scripts: entry.scripts,
            startup: entry.startup,
            commands: entry.commands,
          }
        : {
            repository: entry.repository,
            branch: entry.branch,
            scripts: entry.scripts,
            startup: entry.startup,
            commands: entry.commands,
          },
    );
    replaceSetup({
      params: { orgId, projectId },
      payload: { machineSize: setup.machineSize, repositories },
      reactivityKeys: [projectSettingsKeys.setup(orgId, projectId)],
    })
      .then(() => toast.success("Base branch saved"))
      .catch(() => toast.error("Could not save the base branch"));
  };

  return (
    <>
      <SettingsSection title="Repository">
        <CardList>
          <SettingsRow
            label="Base branch"
            description="Checked out for new threads"
          >
            <Menu>
              <MenuTrigger
                render={
                  <Button variant="solid" size="sm">
                    {repo?.branch ?? "main"}
                    <Glyph name="chevron-down" className="size-(--icon-sm)" />
                  </Button>
                }
              >
                {repoFullName} base branch
              </MenuTrigger>
              <MenuContent align="end" className="w-44">
                {[
                  ...new Set([
                    repo?.branch ?? "main",
                    "main",
                    "master",
                    "develop",
                  ]),
                ].map((branch) => (
                  <MenuItem key={branch} onClick={() => setBranch(branch)}>
                    {branch}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          </SettingsRow>
        </CardList>
      </SettingsSection>
      <SettingsSection
        title="Scripts"
        description="Initialize builds the filesystem a snapshot keeps; refresh brings a moved checkout current. Leave one empty to run nothing"
      >
        <CardList>
          <div className="flex flex-col gap-2 p-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Initialize
              </span>
              <Textarea
                aria-label="Initialize script"
                rows={4}
                placeholder="bun install"
                value={current.initialize}
                onChange={(event) =>
                  setDraft({ ...current, initialize: event.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Refresh
              </span>
              <Textarea
                aria-label="Refresh script"
                rows={3}
                placeholder="bun install"
                value={current.refresh}
                onChange={(event) =>
                  setDraft({ ...current, refresh: event.target.value })
                }
              />
            </div>
          </div>
          <SettingsRow
            label="Startup"
            description={entrySummary(current.startup, "No startup entries")}
          />
          <SettingsRow
            label="Commands"
            description={entrySummary(current.commands, "No commands")}
          />
          <div className="flex items-center justify-end gap-2 p-4">
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                Discard
              </Button>
            )}
            <Button
              intent="accent"
              size="sm"
              loading={saving}
              disabled={!dirty}
              onClick={save}
            >
              Save
            </Button>
          </div>
        </CardList>
      </SettingsSection>
    </>
  );
}
