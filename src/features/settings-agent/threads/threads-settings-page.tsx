import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import {
  SettingsLoadingCard,
  SettingsSection,
} from "@/components/settings-page";
import {
  setOrgTitlePromptAtom,
  setOrgTitleTriggersAtom,
  setTaskLimitsAtom,
  setTitlePromptAtom,
  setTitleTriggersAtom,
  updatePreferencesAtom,
} from "@/data/atoms/agent-settings";
import { reactivityKeys } from "@/data/atoms/conventions";
import { entry as threadsEntry } from "@/features/settings/nav/entries/threads";
import type { SettingsNavEntry } from "@/features/settings/nav/registry";
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
import { SettingsRow } from "@/primitives/settings-row";
import { Textarea } from "@/primitives/textarea";
import { toast } from "@/primitives/toaster";
import {
  archiveIdleOptions,
  archiveIdleValue,
  defaultTaskLimits,
  errorMessage,
  type SettingsScope,
  type TaskLimitKey,
  type TaskLimits,
  titlePromptMaxLength,
  titleTriggerChoice,
  titleTriggerOptions,
  titleTriggersFor,
} from "./agent-settings";
import { patchTaskLimits, taskLimitsPayload } from "./setting-payloads";
import {
  InheritedNumberField,
  InheritedSelect,
  SettingsAgentPage,
} from "./settings-agent-controls";
import {
  useActiveOrganization,
  useAgentPreferences,
  useFeedbackSettings,
  useIsAdmin,
} from "./use-agent-settings";

/** A searchable settings row from the catalog: its anchor id and title. */
export const catalogRow = (page: SettingsNavEntry, id: string) => {
  const row = page.rows?.find((candidate) => candidate.id === id);
  if (row === undefined)
    throw new TypeError(`Unknown settings catalog id: ${id}`);
  return { id: row.id, title: row.title };
};

const row = (id: string) => catalogRow(threadsEntry, id);

const userKeys = [reactivityKeys.currentUser];
const orgKeys = [reactivityKeys.organizations];

export function ThreadsSettingsPage() {
  return (
    <SettingsAgentPage page="threads">
      {(scope) =>
        scope === "you" ? (
          <ThreadsYou />
        ) : (
          <>
            <OrgSubagentsSection />
            <TitleInstructionsSection scope="org" />
          </>
        )
      }
    </SettingsAgentPage>
  );
}

function ThreadsYou() {
  const { organization, failed } = useActiveOrganization();
  const preferencesQuery = useAgentPreferences();
  const feedbackQuery = useFeedbackSettings();
  const updatePreferences = useAtomSet(updatePreferencesAtom, {
    mode: "promise",
  });
  const [busy, setBusy] = useState<string | null>(null);
  if (preferencesQuery.failed || feedbackQuery.failed || failed)
    return (
      <SettingsSection title="Threads">
        <SettingsRow
          label="Could not load thread settings"
          description="Check your connection and try again"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
          >
            Retry
          </Button>
        </SettingsRow>
      </SettingsSection>
    );
  const preferences = preferencesQuery.value;
  const feedback = feedbackQuery.value;
  if (preferences === undefined || feedback === undefined)
    return <SettingsLoadingCard />;
  const archive = row("archive-idle-threads");
  const updateTasks = (key: TaskLimitKey, value: number | undefined) => {
    setBusy(key);
    updatePreferences({
      payload: { tasks: patchTaskLimits(preferences, key, value) },
      reactivityKeys: userKeys,
    })
      .catch((error) =>
        toast.error(
          errorMessage(error, "Could not update your subagent limits"),
        ),
      )
      .finally(() => setBusy(null));
  };
  return (
    <>
      <TitleInstructionsSection scope="you" />
      <SettingsSection title="Archiving">
        <Card rows>
          <SettingsRow
            id={archive.id}
            label={archive.title}
            description="Pinned threads and threads with an open pull request are kept"
          >
            <InheritedSelect
              aria-label={archive.title}
              value={String(preferences.archiveIdleAfterDays ?? "off")}
              options={archiveIdleOptions}
              className="w-36 justify-between"
              disabled={busy !== null}
              onChange={(value) => {
                setBusy("archiveIdleAfterDays");
                updatePreferences({
                  payload: {
                    archiveIdleAfterDays: archiveIdleValue(value ?? "off"),
                  },
                  reactivityKeys: userKeys,
                })
                  .catch((error) =>
                    toast.error(
                      errorMessage(
                        error,
                        "Could not update idle thread archiving",
                      ),
                    ),
                  )
                  .finally(() => setBusy(null));
              }}
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
      {organization === undefined ? null : (
        <SubagentsSection
          scope="you"
          values={preferences.tasks}
          organization={{
            concurrent:
              organization.taskConcurrentLimit ?? defaultTaskLimits.concurrent,
            nestedDepth:
              organization.taskNestedDepth ?? defaultTaskLimits.nestedDepth,
          }}
          busy={busy}
          onChange={updateTasks}
        />
      )}
    </>
  );
}

function OrgSubagentsSection() {
  const { organization, waiting, failed } = useActiveOrganization();
  const setTaskLimits = useAtomSet(setTaskLimitsAtom, { mode: "promise" });
  const { isAdmin, adminReason } = useIsAdmin();
  const [busy, setBusy] = useState<TaskLimitKey | null>(null);
  if (failed)
    return (
      <SettingsSection title="Subagents">
        <SettingsRow
          label="Could not load subagent settings"
          description="Check your connection and try again"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </SettingsRow>
      </SettingsSection>
    );
  if (organization === undefined) return <SettingsLoadingCard />;
  return (
    <SubagentsSection
      scope="org"
      values={{
        concurrent: organization.taskConcurrentLimit ?? undefined,
        nestedDepth: organization.taskNestedDepth ?? undefined,
      }}
      organization={defaultTaskLimits}
      busy={busy}
      disabled={!isAdmin || waiting}
      disabledReason={adminReason}
      onChange={(key, value) => {
        setBusy(key);
        setTaskLimits({
          params: { orgId: organization.id },
          payload: taskLimitsPayload(
            key,
            value,
            {
              concurrent: organization.taskConcurrentLimit ?? undefined,
              nestedDepth: organization.taskNestedDepth ?? undefined,
            },
            defaultTaskLimits,
          ),
          reactivityKeys: orgKeys,
        })
          .catch((error) =>
            toast.error(
              errorMessage(
                error,
                "Could not update the organization subagent limits",
              ),
            ),
          )
          .finally(() => setBusy(null));
      }}
    />
  );
}

function SubagentsSection({
  scope,
  values,
  organization,
  busy,
  disabled = false,
  disabledReason,
  onChange,
}: {
  scope: SettingsScope;
  values: TaskLimits | undefined;
  organization: { concurrent: number; nestedDepth: number };
  busy: string | null;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (key: TaskLimitKey, value: number | undefined) => void;
}) {
  const you = scope === "you";
  const concurrent = row("task-concurrent-limit");
  const nested = row("task-nested-depth");
  const inheritedTag = you ? "Org" : "Default";
  const inheritedLabel = you ? "Use org default" : "Use Capy default";
  return (
    <SettingsSection
      title="Subagents"
      description={
        you
          ? "How far threads you start can fan out; Org default inherits the organization setting"
          : "How far any thread in the organization can fan out; personal overrides win"
      }
    >
      <Card rows>
        <SettingsRow
          id={concurrent.id}
          label={concurrent.title}
          description="How many subagents may run at once across a thread's whole tree"
        >
          <InheritedNumberField
            aria-label="Concurrent subagents"
            value={values?.concurrent}
            inherited={organization.concurrent}
            inheritedTag={inheritedTag}
            inheritedLabel={inheritedLabel}
            max={100}
            saving={busy === "concurrent"}
            disabled={disabled || busy !== null}
            disabledReason={disabledReason}
            onChange={(value) => onChange("concurrent", value)}
          />
        </SettingsRow>
        <SettingsRow
          id={nested.id}
          label={nested.title}
          description="How many levels of subagents may nest under a thread; 1 means subagents cannot spawn their own"
        >
          <InheritedNumberField
            aria-label="Nested subagent depth"
            value={values?.nestedDepth}
            inherited={organization.nestedDepth}
            inheritedTag={inheritedTag}
            inheritedLabel={inheritedLabel}
            max={8}
            saving={busy === "nestedDepth"}
            disabled={disabled || busy !== null}
            disabledReason={disabledReason}
            onChange={(value) => onChange("nestedDepth", value)}
          />
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}

function TitleInstructionsSection({ scope }: { scope: SettingsScope }) {
  const { organization } = useActiveOrganization();
  const setTitlePrompt = useAtomSet(setTitlePromptAtom, { mode: "promise" });
  const setOrgTitlePrompt = useAtomSet(setOrgTitlePromptAtom, {
    mode: "promise",
  });
  const { isAdmin, adminReason } = useIsAdmin();
  const you = scope === "you";
  const saved =
    (you ? organization?.titlePrompt : organization?.orgTitlePrompt) ?? "";
  const orgPrompt = organization?.orgTitlePrompt ?? null;
  const [draft, setDraft] = useState<{ orgId: string; value: string }>();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const value =
    draft !== undefined && draft.orgId === organization?.id
      ? draft.value
      : saved;
  const trimmed = value.trim();
  const changed = trimmed !== saved;
  const tooLong = trimmed.length > titlePromptMaxLength;
  const locked = organization === undefined || saving || (!you && !isAdmin);
  const lockedReason = !you && !isAdmin ? adminReason : undefined;
  const instructions = row("title-instructions");

  const save = (titlePrompt: string | null) => {
    if (organization === undefined) return;
    setSaving(true);
    (you ? setTitlePrompt : setOrgTitlePrompt)({
      params: { orgId: organization.id },
      payload: { titlePrompt },
      reactivityKeys: orgKeys,
    })
      .then(() => {
        setDraft(undefined);
        toast.success(
          titlePrompt === null
            ? "Title instructions cleared"
            : "Title instructions saved",
        );
      })
      .catch((error) =>
        toast.error(errorMessage(error, "Could not save title instructions")),
      )
      .finally(() => setSaving(false));
  };
  const close = () => {
    setOpen(false);
    setDraft(undefined);
  };

  return (
    <SettingsSection id={instructions.id} title="Thread titles">
      <Card rows>
        <SettingsRow
          label="Title instructions"
          description={
            saved.length === 0 ? (
              you && orgPrompt !== null ? (
                <span className="line-clamp-2">{orgPrompt}</span>
              ) : (
                "None"
              )
            ) : (
              <span className="line-clamp-2">{saved}</span>
            )
          }
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={locked}
            title={lockedReason}
            onClick={() => setOpen(true)}
          >
            {saved.length === 0 ? "Add" : "Edit"}
          </Button>
        </SettingsRow>
        <TitleTriggersRow scope={scope} />
      </Card>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title instructions</DialogTitle>
            <DialogDescription>
              {you
                ? "How Capy names the threads you start, on top of the organization's instructions"
                : "How Capy names every thread started in this organization"}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            {you && orgPrompt !== null ? (
              <div className="flex flex-col gap-1 rounded bg-secondary px-2.5 py-2">
                <span className="text-xs font-medium text-muted-foreground-2">
                  Organization instructions
                </span>
                <p className="text-sm font-normal whitespace-pre-wrap text-foreground">
                  {orgPrompt}
                </p>
              </div>
            ) : null}
            <Textarea
              rows={4}
              value={value}
              placeholder={
                you
                  ? "Keep titles under 30 characters, name the package first"
                  : "Prefix titles with the customer name when one is mentioned"
              }
              aria-label="Title instructions"
              aria-invalid={tooLong || undefined}
              disabled={locked}
              autoFocus
              onChange={(event) =>
                organization &&
                setDraft({ orgId: organization.id, value: event.target.value })
              }
            />
            <span
              className={
                tooLong
                  ? "text-xs font-normal text-destructive"
                  : "text-xs font-normal text-muted-foreground-2"
              }
            >
              {trimmed.length.toLocaleString()} /{" "}
              {titlePromptMaxLength.toLocaleString()}
            </span>
          </DialogBody>
          <DialogFooter>
            {saved.length > 0 ? (
              <Button
                variant="ghost"
                disabled={locked}
                className="mr-auto"
                onClick={() => {
                  save(null);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            ) : null}
            <Button variant="ghost" disabled={saving} onClick={close}>
              Cancel
            </Button>
            <Button
              variant="solid"
              disabled={locked || !changed || tooLong}
              aria-busy={saving || undefined}
              aria-label={saving ? "Saving" : undefined}
              onClick={() => {
                save(trimmed.length === 0 ? null : trimmed);
                setOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

function TitleTriggersRow({ scope }: { scope: SettingsScope }) {
  const { organization } = useActiveOrganization();
  const setTitleTriggers = useAtomSet(setTitleTriggersAtom, {
    mode: "promise",
  });
  const setOrgTitleTriggers = useAtomSet(setOrgTitleTriggersAtom, {
    mode: "promise",
  });
  const { isAdmin, adminReason } = useIsAdmin();
  const you = scope === "you";
  const [saving, setSaving] = useState(false);
  const orgTriggers = organization?.orgTitleTriggers ?? [];
  const own = you
    ? organization?.titleTriggers
    : organization?.orgTitleTriggers;
  const inheriting = you && own === null;
  const triggers = row("title-triggers");
  const save = (titleTriggers: ReturnType<typeof titleTriggersFor> | null) => {
    if (organization === undefined) return;
    setSaving(true);
    (you ? setTitleTriggers : setOrgTitleTriggers)({
      params: { orgId: organization.id },
      payload: { titleTriggers },
      reactivityKeys: orgKeys,
    })
      .catch((error) =>
        toast.error(errorMessage(error, "Could not update the title triggers")),
      )
      .finally(() => setSaving(false));
  };
  return (
    <SettingsRow
      id={triggers.id}
      label={triggers.title}
      description="Titles you set by hand are kept"
    >
      <InheritedSelect
        value={inheriting ? undefined : titleTriggerChoice(own ?? orgTriggers)}
        inherits={you}
        inherited={you ? titleTriggerChoice(orgTriggers) : undefined}
        inheritedLabel="Org default"
        options={titleTriggerOptions}
        disabled={organization === undefined || saving || (!you && !isAdmin)}
        disabledReason={!you && !isAdmin ? adminReason : undefined}
        aria-label="Regenerate the title when"
        onChange={(choice) =>
          save(choice === undefined ? null : titleTriggersFor(choice))
        }
      />
    </SettingsRow>
  );
}
