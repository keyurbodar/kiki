import type { ReactNode } from "react";
import { SettingsSection } from "@/components/settings-page";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import {
  type ArgRow,
  emptyArg,
  emptyKeyValue,
  type KeyValueRow,
  orgWide,
  type ServerDraft,
} from "../model/draft.ts";
import type { McpAuth } from "../model/types.ts";
import { cx } from "../ui/cx.ts";
import { PlusGlyph } from "../ui/glyphs.tsx";

export const fieldCard = "flex flex-col gap-4 p-4";
export const fieldDivider = "border-t-[0.5px] border-border-1 pt-4";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-foreground";

export function FieldRow({
  label,
  description,
  divided,
  children,
}: {
  readonly label: string;
  readonly description?: string;
  readonly divided?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
        divided && fieldDivider,
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description !== undefined && (
          <span className="text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

export function SelectField<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: Value;
  readonly options: ReadonlyArray<{
    readonly value: Value;
    readonly label: string;
  }>;
  readonly onChange: (value: Value) => void;
}) {
  return (
    <MenuSelect
      value={value}
      onValueChange={(next) => onChange(next as Value)}
      items={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
    >
      <MenuSelectTrigger aria-label={label}>
        <MenuSelectValue />
        <span aria-hidden="true">
          <Icon name="chevron-grabber-vertical" size="sm" />
        </span>
      </MenuSelectTrigger>
      <MenuSelectContent>
        {options.map((option) => (
          <MenuSelectItem key={option.value} value={option.value}>
            {option.label}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}

export function ProjectMenu({
  value,
  projects,
  onChange,
}: {
  readonly value: string;
  readonly projects: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly onChange: (projectId: string) => void;
}) {
  const label =
    value === orgWide
      ? "All projects"
      : (projects.find((project) => project.id === value)?.name ?? "Project");
  return (
    <Menu>
      <MenuTrigger
        aria-label="Project"
        render={<Button variant="ghost" size="sm" />}
      >
        <span className="min-w-0 truncate">{label}</span>
        <Icon name="chevron-grabber-vertical" size="sm" />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem onClick={() => onChange(orgWide)}>All projects</MenuItem>
        {projects.map((project) => (
          <MenuItem key={project.id} onClick={() => onChange(project.id)}>
            {project.name}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export function KeyValueRows({
  noun,
  rows,
  secret,
  onChange,
}: {
  readonly noun: string;
  readonly rows: ReadonlyArray<KeyValueRow>;
  readonly secret?: boolean;
  readonly onChange: (rows: ReadonlyArray<KeyValueRow>) => void;
}) {
  const update = (id: string, change: Partial<KeyValueRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...change } : row)));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"
        >
          <Input
            aria-label={`${noun} ${index + 1} name`}
            placeholder="Key"
            value={row.key}
            onChange={(event) => update(row.id, { key: event.target.value })}
          />
          <Input
            aria-label={`${noun} ${index + 1} value`}
            placeholder="Value"
            type={secret === false ? "text" : "password"}
            autoComplete="new-password"
            value={row.value}
            onChange={(event) => update(row.id, { value: event.target.value })}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${noun.toLowerCase()} ${index + 1}`}
            onClick={() =>
              onChange(
                rows.length === 1
                  ? [emptyKeyValue()]
                  : rows.filter((entry) => entry.id !== row.id),
              )
            }
          >
            <Icon name="x" />
          </Button>
        </div>
      ))}
      <Button
        variant="soft"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...rows, emptyKeyValue()])}
      >
        <PlusGlyph />
        Add {noun.toLowerCase()}
      </Button>
    </div>
  );
}

function ArgRows({
  rows,
  onChange,
}: {
  readonly rows: ReadonlyArray<ArgRow>;
  readonly onChange: (rows: ReadonlyArray<ArgRow>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
        >
          <Input
            aria-label={`Argument ${index + 1}`}
            placeholder={index === 0 ? "--yes" : "Argument"}
            value={row.value}
            onChange={(event) =>
              onChange(
                rows.map((entry) =>
                  entry.id === row.id
                    ? { ...entry, value: event.target.value }
                    : entry,
                ),
              )
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove argument ${index + 1}`}
            onClick={() =>
              onChange(
                rows.length === 1
                  ? [emptyArg()]
                  : rows.filter((entry) => entry.id !== row.id),
              )
            }
          >
            <Icon name="x" />
          </Button>
        </div>
      ))}
      <Button
        variant="soft"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...rows, emptyArg()])}
      >
        <PlusGlyph />
        Add argument
      </Button>
    </div>
  );
}

type DraftChange = (change: Partial<ServerDraft>) => void;

export function RuntimeSection({
  draft,
  onChange,
}: {
  readonly draft: ServerDraft;
  readonly onChange: DraftChange;
}) {
  const command = draft.placement === "command";
  return (
    <SettingsSection title="Runtime">
      <Card className={fieldCard}>
        <FieldRow
          label="Transport"
          description={
            command
              ? "Capy talks to a process it launches over stdin and stdout"
              : "Capy speaks MCP over HTTP to a listening server"
          }
        >
          <SelectField
            label="Transport"
            value={draft.placement}
            options={[
              { value: "url", label: "Streamable HTTP" },
              { value: "command", label: "STDIO" },
            ]}
            onChange={(placement) => onChange({ placement })}
          />
        </FieldRow>
        {command ? (
          <>
            <label className={cx(labelClass, fieldDivider)}>
              Command to launch
              <Input
                placeholder="npx"
                value={draft.command}
                onChange={(event) => onChange({ command: event.target.value })}
              />
            </label>
            <div className={labelClass}>
              Arguments
              <ArgRows
                rows={draft.args}
                onChange={(args) => onChange({ args })}
              />
            </div>
            <label className={labelClass}>
              Working directory
              <Input
                placeholder="~/code"
                value={draft.cwd}
                onChange={(event) => onChange({ cwd: event.target.value })}
              />
            </label>
            <label className={labelClass}>
              Also listens on
              <Input
                placeholder="http://127.0.0.1:8080/mcp"
                value={draft.launchUrl}
                onChange={(event) =>
                  onChange({ launchUrl: event.target.value })
                }
              />
              <span className="text-xs font-normal text-muted-foreground-2">
                Optional: a loopback url the launched process serves MCP on,
                instead of stdio
              </span>
            </label>
          </>
        ) : (
          <label className={cx(labelClass, fieldDivider)}>
            URL
            <Input
              type="url"
              placeholder="https://mcp.example.com/mcp"
              aria-invalid={
                draft.url !== "" && !draft.url.startsWith("https://")
              }
              value={draft.url}
              onChange={(event) => onChange({ url: event.target.value })}
            />
          </label>
        )}
      </Card>
    </SettingsSection>
  );
}

const authOptions: ReadonlyArray<{
  readonly value: McpAuth;
  readonly label: string;
  readonly description: string;
}> = [
  {
    value: "oauth",
    label: "Sign in",
    description:
      "Members sign in through the server's own login before Capy can use it",
  },
  {
    value: "headers",
    label: "API key",
    description: "A token Capy sends as a header on every request",
  },
  {
    value: "none",
    label: "No sign-in",
    description: "The server accepts requests without credentials",
  },
];

export function RadioCard({
  checked,
  label,
  description,
  onSelect,
}: {
  readonly checked: boolean;
  readonly label: string;
  readonly description: string;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full cursor-pointer select-none flex-row items-center gap-3 overflow-clip rounded-(--radius-card) border-[0.5px] border-(--card-hairline) bg-card px-4 py-3 text-left shadow-card transition-colors duration-fast hover:bg-card-hover focus-visible:outline-ring-inset disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{label}</span>
        </span>
        <span className="text-xs font-normal text-muted-foreground-1 sm:truncate">
          {description}
        </span>
      </span>
      <span
        className={cx(
          "flex size-4 shrink-0 items-center justify-center rounded-full border-[0.5px] transition-colors duration-fast",
          checked
            ? "border-transparent bg-primary"
            : "border-[light-dark(var(--border-3),var(--muted-foreground-3))] bg-input",
        )}
      >
        {checked && (
          <span className="size-1.5 rounded-full bg-primary-foreground" />
        )}
      </span>
    </button>
  );
}

export function AuthenticationSection({
  draft,
  onChange,
}: {
  readonly draft: ServerDraft;
  readonly onChange: DraftChange;
}) {
  if (draft.placement === "command") return null;
  return (
    <SettingsSection title="Authentication">
      <div
        role="radiogroup"
        aria-label="Authentication"
        className="flex flex-col gap-2"
      >
        {authOptions.map((option) => (
          <RadioCard
            key={option.value}
            checked={draft.auth === option.value}
            label={option.label}
            description={option.description}
            onSelect={() => onChange({ auth: option.value })}
          />
        ))}
      </div>
      {draft.auth === "headers" && (
        <Card className={fieldCard}>
          <div className={labelClass}>
            Headers
            <KeyValueRows
              noun="Header"
              rows={draft.headers}
              onChange={(headers) => onChange({ headers })}
            />
            <span className="text-xs font-normal text-muted-foreground-2">
              Model-visible values show in full, other values stay hidden;
              entering rows replaces them
            </span>
          </div>
        </Card>
      )}
      {draft.auth === "oauth" && (
        <div
          role="radiogroup"
          aria-label="OAuth client"
          className="flex flex-col gap-2"
        >
          {(
            [
              {
                value: "auto",
                label: "Automatic",
                description:
                  "Capy's published identity when the server supports it, else it registers itself",
              },
              {
                value: "own",
                label: "Your own client",
                description:
                  "A client id you registered with the server yourself",
              },
            ] as const
          ).map((option) => (
            <RadioCard
              key={option.value}
              checked={
                option.value === "own"
                  ? draft.clientIdentity === "own"
                  : draft.clientIdentity !== "own"
              }
              label={option.label}
              description={option.description}
              onSelect={() => onChange({ clientIdentity: option.value })}
            />
          ))}
          {draft.clientIdentity === "own" && (
            <Card className={fieldCard}>
              <label className={labelClass}>
                Client ID
                <Input
                  value={draft.clientId}
                  onChange={(event) =>
                    onChange({ clientId: event.target.value })
                  }
                />
              </label>
              <label className={labelClass}>
                Client secret
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Optional"
                  value={draft.clientSecret}
                  onChange={(event) =>
                    onChange({ clientSecret: event.target.value })
                  }
                />
              </label>
            </Card>
          )}
        </div>
      )}
    </SettingsSection>
  );
}

export function VariablesSection({
  draft,
  onChange,
}: {
  readonly draft: ServerDraft;
  readonly onChange: DraftChange;
}) {
  const command = draft.placement === "command";
  return (
    <SettingsSection
      title="Variables"
      description={
        command
          ? "Passed to the process as environment variables when it launches; values are sealed on save"
          : "Sent as request headers on every call to the endpoint; values are sealed on save"
      }
    >
      <Card className="flex flex-col gap-3 p-4">
        <KeyValueRows
          noun="Variable"
          rows={command ? draft.env : draft.requestHeaders}
          onChange={(rows) =>
            onChange(command ? { env: rows } : { requestHeaders: rows })
          }
        />
      </Card>
    </SettingsSection>
  );
}
