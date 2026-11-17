import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/primitives/popover";
import {
  catalogEntry,
  type ModelEntry,
  type ModelSelection,
  selectionEffort,
  selectionName,
} from "./model-selection";

const triggerClass = "w-full justify-between @xl:w-64";
const rowClass = "@max-xl:flex-col @max-xl:items-stretch @max-xl:gap-3";
const providerColors: Record<string, string> = {
  anthropic: "text-[#d97757]",
  openai: "text-[#10a37f]",
  google: "text-[#4285f4]",
};

export function ClaudeMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
    >
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
    </svg>
  );
}

function ProviderMark({ provider }: { provider: string }) {
  if (provider === "anthropic" || provider === "claude-code")
    return <ClaudeMark className="size-(--icon-sm)" />;
  return (
    <span
      aria-hidden
      className={`grid size-(--icon-sm) place-items-center rounded-(--radius-sm) bg-secondary text-2xs font-medium ${providerColors[provider] ?? "text-foreground"}`}
    >
      {provider.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ModelGlyph({
  selection,
  catalog,
}: {
  selection: ModelSelection | null;
  catalog: ReadonlyArray<ModelEntry>;
}) {
  const provider =
    selection === null
      ? "anthropic"
      : (catalogEntry(catalog, selection)?.provider ??
        selection.modelId.split("/")[0]);
  return <ProviderMark provider={provider} />;
}

export function ModelTriggerLabel({
  selection,
  catalog,
}: {
  selection: ModelSelection | null;
  catalog: ReadonlyArray<ModelEntry>;
}) {
  const effort = selectionEffort(catalog, selection);
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <ModelGlyph selection={selection} catalog={catalog} />
      <span className="min-w-0 truncate">{selectionName(catalog, selection)}</span>
      {effort !== "" && (
        <span className="shrink-0 text-muted-foreground-2">{effort}</span>
      )}
    </span>
  );
}

export function ModelChooser({
  value,
  catalog,
  disabled,
  badge,
  onChange,
  inherit,
}: {
  value: ModelSelection | null;
  catalog: ReadonlyArray<ModelEntry>;
  disabled?: boolean;
  badge?: string;
  onChange: (value: ModelSelection | null) => void;
  inherit?: {
    label: string;
    value: ModelSelection | null;
    active: boolean;
  };
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const needle = query.trim().toLowerCase();
  const matches = catalog.filter(
    (entry) =>
      entry.name.toLowerCase().includes(needle) ||
      entry.id.toLowerCase().includes(needle),
  );
  const pick = (entry: ModelEntry) => {
    onChange({ modelId: entry.id, reasoningMode: entry.defaultEffort });
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Model"
            disabled={disabled}
            className={triggerClass}
          >
            <ModelTriggerLabel selection={value} catalog={catalog} />
            <span className="flex shrink-0 items-center gap-1.5">
              {badge !== undefined && <Badge size="xs">{badge}</Badge>}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
              >
                <path
                  d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <input
          aria-label="Search models"
          placeholder="Search models"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-(--h-control-sm) w-full min-w-0 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
        />
        {inherit?.active === true && (
          <button
            type="button"
            onClick={() => {
              onChange(inherit.value);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-foreground hover:bg-secondary"
          >
            <span>{inherit.label}</span>
          </button>
        )}
        {matches.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm font-normal text-muted-foreground-2">
            No model matches
          </p>
        ) : (
          matches.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => pick(entry)}
              className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-sm text-foreground hover:bg-secondary"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <ProviderMark provider={entry.provider} />
                <span className="truncate">{entry.name}</span>
              </span>
              {value?.modelId === entry.id && (
                <span aria-hidden className="text-foreground">
                  ✓
                </span>
              )}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

export function DefaultModelsSection({
  catalog,
  webValue,
  orgValue,
  surfaceValues,
  isAdmin,
  adminReason,
  saving,
  catalogFailed,
  onSaveWeb,
  onSaveOrg,
  onSaveSurface,
}: {
  catalog: ReadonlyArray<ModelEntry>;
  webValue: ModelSelection | null;
  orgValue: ModelSelection | null;
  surfaceValues: Record<string, ModelSelection | null>;
  isAdmin: boolean;
  adminReason?: string;
  saving: string | null;
  catalogFailed: boolean;
  onSaveWeb: (value: ModelSelection | null) => void;
  onSaveOrg: (value: ModelSelection | null) => void;
  onSaveSurface: (surface: string, value: ModelSelection | null) => void;
}) {
  if (catalogFailed)
    return (
      <p
        role="status"
        className="px-4 py-4 text-sm text-muted-foreground-2"
      >
        No listed model matches
      </p>
    );

  const surfaces = [
    {
      surface: "slack",
      id: "slack-default-model",
      label: "Slack",
      description: "Used for threads you start from Slack",
    },
    {
      surface: "linear",
      id: "linear-default-model",
      label: "Linear",
      description: "Used for threads started from Linear issues",
    },
  ];

  return (
    <div data-slot="card" className="@container">
      <SettingsRow
        id="model-defaults"
        label="Web"
        description="Set by your pick in the home composer"
        className={rowClass}
      >
        <ModelChooser
          value={webValue}
          catalog={catalog}
          disabled={saving !== null}
          badge={webValue === null ? "Org" : undefined}
          inherit={{
            label: "Org default",
            value: orgValue,
            active: webValue === null,
          }}
          onChange={onSaveWeb}
        />
      </SettingsRow>
      {surfaces.map((item) => (
        <SettingsRow
          key={item.surface}
          id={item.id}
          label={item.label}
          description={item.description}
          className={rowClass}
        >
          <ModelChooser
            value={surfaceValues[item.surface] ?? null}
            catalog={catalog}
            disabled={saving !== null}
            badge={surfaceValues[item.surface] === null ? "Web" : undefined}
            onChange={(value) => onSaveSurface(item.surface, value)}
            inherit={{
              label: "Web default",
              value: webValue,
              active: surfaceValues[item.surface] === null,
            }}
          />
        </SettingsRow>
      ))}
      <SettingsRow
        id="org-default-model"
        label="Organization default"
        description="For members without a web default, and service users"
        className={rowClass}
      >
        {isAdmin ? (
          <ModelChooser
            value={orgValue}
            catalog={catalog}
            disabled={saving !== null}
            onChange={onSaveOrg}
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-label="Model"
            disabled
            title={adminReason}
            className={triggerClass}
          >
            <ModelTriggerLabel selection={orgValue} catalog={catalog} />
          </Button>
        )}
      </SettingsRow>
    </div>
  );
}

function SettingsRow({
  id,
  label,
  description,
  className,
  children,
}: {
  id?: string;
  label: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      data-slot="settings-row"
      className={`group/row flex gap-6 p-4 items-center justify-between ${className ?? ""}`}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="font-normal text-muted-foreground-2 text-sm">
          {description}
        </div>
      </div>
      <div className="relative flex shrink-0 items-center gap-2">
        {children}
      </div>
    </div>
  );
}
