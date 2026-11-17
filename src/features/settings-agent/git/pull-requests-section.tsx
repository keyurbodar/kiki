import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/settings-page";
import {
  feedbackBotHealthAtom,
  feedbackBotsAtom,
} from "@/data/atoms/agent-settings";
import { entry as gitEntry } from "@/features/settings/nav/entries/git";
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
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  menuRowVariants,
} from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Table } from "@/primitives/table";
import {
  catalogRow,
  type FeedbackMode,
  type FeedbackOverrides,
  type FeedbackSettings,
  InheritedNumberField,
  InheritedSelect,
  menuCheckClass,
  menuIconSlot,
  relativeTime,
  type SettingsScope,
  useActiveOrganization,
} from "../threads";
import {
  type BotHealth,
  botAllowlistMax,
  canAddBot,
  ciModeOptions,
  conflictModeOptions,
  feedbackModeOptions,
  githubAvatarUrl,
  readBotHealth,
  readSeenBots,
  replaceBot,
  withoutBot,
} from "./git-settings";

const row = (id: string) => catalogRow(gitEntry, id);
const buttonIconClass = "size-(--icon-sm) shrink-0";

export type FeedbackModeKey =
  | "humanMode"
  | "botMode"
  | "ciMode"
  | "conflictMode";

export type PullRequestSettingsProps = {
  scope: SettingsScope;
  values: FeedbackOverrides | undefined;
  organization: FeedbackSettings;
  busy: string | null;
  disabled?: boolean;
  disabledReason?: string;
  onModeChange: (
    key: FeedbackModeKey,
    mode: FeedbackMode | string | undefined,
  ) => void;
  onAgeChange: (days: number | undefined) => void;
  onBotAllowlistChange: (logins: string[] | undefined) => void;
  onDraftDefaultChange: (draft: boolean | undefined) => void;
  onBadgeChange: (shown: boolean | undefined) => void;
};

/** Capy's pull request behavior: draft default, badge, feedback modes, review bots and the bot list. */
export function PullRequestSettings({
  scope,
  values,
  organization,
  busy,
  disabled = false,
  disabledReason,
  onModeChange,
  onAgeChange,
  onBotAllowlistChange,
  onDraftDefaultChange,
  onBadgeChange,
}: PullRequestSettingsProps) {
  const you = scope === "you";
  const locked = disabled || busy !== null;
  const draft = row("pr-draft-default");
  const badge = row("pr-badge");
  const human = row("human-feedback");
  const ci = row("ci-results");
  const conflicts = row("merge-conflicts");
  const botFeedback = row("review-bot-feedback");
  const bots = row("review-bots");
  const modes = {
    humanMode: feedbackModeOptions,
    botMode: feedbackModeOptions,
    ciMode: ciModeOptions,
    conflictMode: conflictModeOptions,
  } satisfies Record<
    FeedbackModeKey,
    ReadonlyArray<{ value: string; label: string }>
  >;
  const modeRow = (
    key: FeedbackModeKey,
    entry: { id: string; title: string },
    description: string,
  ) => (
    <SettingsRow id={entry.id} label={entry.title} description={description}>
      <InheritedSelect
        value={values?.[key]}
        inherits={you}
        inherited={you ? organization[key] : undefined}
        options={modes[key]}
        disabled={locked}
        disabledReason={disabledReason}
        onChange={(mode) => onModeChange(key, mode)}
      />
    </SettingsRow>
  );
  return (
    <>
      <SettingsSection
        title="Pull requests"
        description={
          you
            ? "Personal overrides for threads you start; Org default inherits the organization setting"
            : "Organization default for all members; personal overrides win"
        }
      >
        <Card rows>
          <SettingsRow
            id={draft.id}
            label={draft.title}
            description="Drafts stay unpublished until you ask for a ready pull request"
          >
            <InheritedSelect
              value={
                values?.prDraftDefault === undefined
                  ? undefined
                  : values.prDraftDefault
                    ? "draft"
                    : "ready"
              }
              inherits={you}
              inherited={
                you
                  ? organization.prDraftDefault
                    ? "draft"
                    : "ready"
                  : undefined
              }
              options={[
                { value: "ready", label: "Ready for review" },
                { value: "draft", label: "Draft" },
              ]}
              disabled={locked}
              disabledReason={disabledReason}
              onChange={(value) =>
                onDraftDefaultChange(
                  value === undefined ? undefined : value === "draft",
                )
              }
            />
          </SettingsRow>
          <SettingsRow
            id={badge.id}
            label={badge.title}
            description="Adds an Open in Capy button to pull requests Capy opens"
          >
            <InheritedSelect
              value={
                values?.prBadge === undefined
                  ? undefined
                  : values.prBadge
                    ? "shown"
                    : "hidden"
              }
              inherits={you}
              inherited={
                you ? (organization.prBadge ? "shown" : "hidden") : undefined
              }
              options={[
                { value: "shown", label: "Shown" },
                { value: "hidden", label: "Hidden" },
              ]}
              disabled={locked}
              disabledReason={disabledReason}
              onChange={(value) =>
                onBadgeChange(
                  value === undefined ? undefined : value === "shown",
                )
              }
            />
          </SettingsRow>
          {modeRow("humanMode", human, "Reviews and comments from people")}
          {modeRow(
            "ciMode",
            ci,
            "When checks fail or settle on a pull request Capy opened",
          )}
          {modeRow(
            "conflictMode",
            conflicts,
            "When an open pull request becomes conflicted",
          )}
          <MaxThreadAgeRow
            value={values?.conflictMaxThreadAgeDays}
            organizationDefault={
              you ? organization.conflictMaxThreadAgeDays : undefined
            }
            saving={busy === "conflictMaxThreadAgeDays"}
            disabled={locked}
            disabledReason={disabledReason}
            onChange={onAgeChange}
          />
        </Card>
      </SettingsSection>
      <SettingsSection title="Review bots">
        <Card rows>
          {modeRow(
            "botMode",
            botFeedback,
            "Reviews and comments from listed bots",
          )}
        </Card>
      </SettingsSection>
      <SettingsSection
        id={bots.id}
        title={bots.title}
        description="Only these GitHub bots can leave feedback Capy acts on"
        action={
          you ? (
            <InheritedSelect
              value={values?.botAllowlist === undefined ? undefined : "custom"}
              inherits
              inheritedLabel="Org default"
              options={[{ value: "custom", label: "Your list" }]}
              variant="ghost"
              disabled={locked}
              aria-label="Bot list source"
              onChange={(value) => {
                if (value === undefined) onBotAllowlistChange(undefined);
                if (value === "custom" && values?.botAllowlist === undefined)
                  onBotAllowlistChange([...organization.botAllowlist]);
              }}
            />
          ) : undefined
        }
      >
        <BotAllowlist
          key={`${scope}:${values?.botAllowlist?.join(",") ?? "default"}`}
          value={values?.botAllowlist}
          organizationDefault={you ? organization.botAllowlist : undefined}
          disabled={locked}
          disabledReason={disabledReason}
          onChange={onBotAllowlistChange}
        />
      </SettingsSection>
    </>
  );
}

function MaxThreadAgeRow({
  value,
  organizationDefault,
  saving,
  disabled,
  disabledReason,
  onChange,
}: {
  value: number | undefined;
  organizationDefault: number | undefined;
  saving: boolean;
  disabled: boolean;
  disabledReason?: string;
  onChange: (days: number | undefined) => void;
}) {
  const age = row("merge-conflict-thread-age");
  return (
    <SettingsRow
      id={age.id}
      label={age.title}
      description="Conflict updates wake threads active within this many days"
    >
      <InheritedNumberField
        aria-label="Merge-conflict max thread age in days"
        value={value}
        inherited={organizationDefault ?? 3}
        inheritedTag={organizationDefault === undefined ? "Default" : "Org"}
        inheritedLabel={
          organizationDefault === undefined
            ? "Use Capy default"
            : "Use org default"
        }
        max={365}
        saving={saving}
        disabled={disabled}
        disabledReason={disabledReason}
        onChange={onChange}
      />
    </SettingsRow>
  );
}

const idleResult: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
  Atom.make(AsyncResult.initial());

function useBotHealth(logins: ReadonlyArray<string>) {
  const { organization } = useActiveOrganization();
  const atom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    organization === undefined || logins.length === 0
      ? idleResult
      : feedbackBotHealthAtom(organization.id, logins);
  const result = useAtomValue(atom);
  return new Map(
    (AsyncResult.isSuccess(result) ? readBotHealth(result.value) : []).map(
      (health) => [health.login.toLowerCase(), health] as const,
    ),
  );
}

function BotAllowlist({
  value,
  organizationDefault,
  disabled,
  disabledReason,
  onChange,
}: {
  value: string[] | undefined;
  organizationDefault: string[] | undefined;
  disabled: boolean;
  disabledReason?: string;
  onChange: (logins: string[]) => void;
}) {
  const list = value ?? organizationDefault ?? [];
  const [adding, setAdding] = useState(false);
  const health = useBotHealth(list);
  const full = list.length >= botAllowlistMax;
  return (
    <>
      <Card>
        <Table density="pick" aria-label={row("review-bots").title}>
          <thead>
            <tr>
              <th>Bot</th>
              <th>Seen</th>
              <th className="justify-end pr-0 text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Add bot"
                  title={
                    full ? "Maximum 20 bots" : (disabledReason ?? "Add bot")
                  }
                  disabled={disabled || full}
                  className="-my-1"
                  onClick={() => setAdding(true)}
                >
                  <Icon name="plus-medium" className={buttonIconClass} />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="col-span-full text-sm">
                  No review bots
                </td>
              </tr>
            ) : (
              list.map((login) => (
                <BotAllowlistRow
                  key={login}
                  login={login}
                  health={health.get(login.toLowerCase())}
                  disabled={disabled}
                  disabledReason={disabledReason}
                  onRemove={() => onChange(withoutBot(list, login))}
                  onReplace={(next) => onChange(replaceBot(list, login, next))}
                />
              ))
            )}
          </tbody>
        </Table>
      </Card>
      <AddBotDialog
        open={adding}
        listed={list}
        onOpenChange={setAdding}
        onAdd={(login) => {
          onChange([...list, login]);
          setAdding(false);
        }}
      />
    </>
  );
}

function BotAvatar({ login, src }: { login: string; src?: string | null }) {
  return (
    <img
      src={src ?? githubAvatarUrl(login)}
      alt=""
      className="size-4 shrink-0 rounded-full"
    />
  );
}

function BotAllowlistRow({
  login,
  health,
  disabled,
  disabledReason,
  onRemove,
  onReplace,
}: {
  login: string;
  health: BotHealth | undefined;
  disabled: boolean;
  disabledReason?: string;
  onRemove: () => void;
  onReplace: (login: string) => void;
}) {
  const suggestion = health?.status === "unseen" ? health.suggestion : null;
  return (
    <tr className="group/row">
      <td>
        <span className="flex items-center gap-2 text-sm text-foreground">
          <BotAvatar login={login} />
          <span className="min-w-0 truncate">{login}</span>
        </span>
      </td>
      <td>
        {health?.status === "unseen" ? (
          <span
            className="text-warning-fg"
            title="No bot with this login has authored on your pull requests"
          >
            Never seen
            {suggestion === null ? "" : `, did you mean ${suggestion}`}
          </span>
        ) : health?.status === "stale" && health.lastSeenAt !== null ? (
          relativeTime(new Date(health.lastSeenAt))
        ) : health?.status === "active" ? (
          "Active"
        ) : null}
      </td>
      <td className="justify-end pr-0 text-right">
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${login}`}
                disabled={disabled}
                title={disabledReason}
                className="opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100 pointer-coarse:opacity-100"
              />
            }
          >
            <Icon name="dot-grid-1x3-horizontal" className={buttonIconClass} />
          </MenuTrigger>
          <MenuContent align="end" className="w-48">
            {suggestion === null ? null : (
              <MenuItem onClick={() => onReplace(suggestion)}>
                <span className={menuIconSlot} />
                Replace with {suggestion}
              </MenuItem>
            )}
            <MenuItem intent="danger" onClick={onRemove}>
              <span className={menuIconSlot} />
              Remove
            </MenuItem>
          </MenuContent>
        </Menu>
      </td>
    </tr>
  );
}

const searchDebounce = 300;

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return value === "" ? "" : debounced;
}

function AddBotDialog({
  open,
  listed,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  listed: ReadonlyArray<string>;
  onOpenChange: (open: boolean) => void;
  onAdd: (login: string) => void;
}) {
  const { organization } = useActiveOrganization();
  const [input, setInput] = useState("");
  const login = input.trim();
  const debounced = useDebounced(login, searchDebounce);
  const search = debounced.length >= 2 ? debounced : "";
  const atom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    organization === undefined || search === ""
      ? idleResult
      : feedbackBotsAtom(organization.id, search);
  const result = useAtomValue(atom);
  const seen = AsyncResult.isSuccess(result) ? readSeenBots(result.value) : [];
  const settled = login.length >= 2 && debounced === login && !result.waiting;
  const addable = canAddBot(login, listed);
  const listedLogins = new Set(listed.map((entry) => entry.toLowerCase()));
  const change = (next: boolean) => {
    if (!next) setInput("");
    onOpenChange(next);
  };
  const add = (next: string) => {
    setInput("");
    onAdd(next);
  };
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add bot</DialogTitle>
          <DialogDescription>
            Only listed GitHub bots can leave feedback Capy acts on
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <Input
            placeholder="GitHub login"
            aria-label="GitHub login"
            value={input}
            autoFocus
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && addable) {
                event.preventDefault();
                add(login);
              }
            }}
          />
          {settled && seen.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground-2">
                Seen on your pull requests
              </span>
              <div className="flex flex-col">
                {seen.map((bot) => {
                  const already = listedLogins.has(bot.login.toLowerCase());
                  return (
                    <button
                      key={bot.login}
                      type="button"
                      className={menuRowVariants({ interaction: "button" })}
                      disabled={already}
                      onClick={() => add(bot.login)}
                    >
                      <span className={menuIconSlot}>
                        <BotAvatar login={bot.login} src={bot.avatarUrl} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {bot.login}
                      </span>
                      {already ? (
                        <Icon name="checkmark-1" className={menuCheckClass} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => change(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            disabled={!addable}
            onClick={() => add(login)}
          >
            Add bot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
