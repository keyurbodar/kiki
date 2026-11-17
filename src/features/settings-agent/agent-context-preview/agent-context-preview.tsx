import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { SettingsSection } from "@/components/settings-page";
import {
  type AgentContextPart,
  type AgentContextPartKind,
  agentContextPreviewAtom,
  agentContextPreviewKey,
  agentModelsAtom,
  captainsAtom,
} from "@/data/atoms/agent-context";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  CaptainAvatar,
  CheckmarkIcon,
  ChevronDownSmallIcon,
  menuItemIconClass,
  resultValue,
  type ScopeProject,
  UserIcon,
  useAgentOrg,
} from "../agent-scopes";
import { formatTokens, tokensOf, windowShare } from "./tokens";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const pageSize = 5;

export const partColor: Record<AgentContextPartKind, string> = {
  org: "bg-chart-1",
  project: "bg-chart-2",
  repo: "bg-chart-3",
  user: "bg-chart-4",
  "project-user": "bg-chart-6",
  captain: "bg-chart-5",
  skills: "bg-chart-7",
};

/** Which parts show, and where: instructions first, deferred repo files paged, the rest last. */
export const groupParts = (parts: ReadonlyArray<AgentContextPart>) => {
  const shown = parts.filter(
    (part) => part.chars > 0 || part.kind === "skills",
  );
  return {
    shown,
    deferred: shown.filter((part) => part.deferred === true),
    loaded: shown.filter(
      (part) =>
        part.kind === "org" ||
        part.kind === "project" ||
        (part.kind === "repo" && part.deferred !== true),
    ),
    rest: shown.filter(
      (part) =>
        part.kind !== "org" && part.kind !== "project" && part.kind !== "repo",
    ),
  };
};

type PickOption = { value: string; label: string; icon: ReactNode };

function PickMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<PickOption>;
  onChange: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <ResponsiveMenu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={label}
            disabled={options.length === 0}
          >
            {current?.icon}
            {current?.label ?? label}
            <ChevronDownSmallIcon />
          </Button>
        }
      />
      <MenuContent
        align="end"
        className="max-h-80 w-64 max-w-full overflow-y-auto md:scroll-fade-y"
      >
        {options.map((option) => (
          <ResponsiveMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            <span className={menuItemIconClass}>{option.icon}</span>
            <span className="truncate">{option.label}</span>
            {option.value === value && (
              <CheckmarkIcon className="size-(--icon-sm) shrink-0 text-foreground" />
            )}
          </ResponsiveMenuItem>
        ))}
      </MenuContent>
    </ResponsiveMenu>
  );
}

function PartRow({ part }: { part: AgentContextPart }) {
  const deferred = part.deferred === true;
  const cut = !deferred && part.loaded < part.chars;
  const file = part.file.split("/").at(-1);
  const faint = deferred || part.loaded === 0;
  const row = (
    <div
      className={cx(
        "flex h-8 items-center gap-2.5 px-4 text-sm",
        part.kind === "repo" && "pl-9",
      )}
    >
      <span
        className={cx(
          "size-2 shrink-0 rounded-xs",
          faint ? "border-hairline border-border-3" : partColor[part.kind],
        )}
      />
      <span className="truncate text-foreground">{part.label}</span>
      {part.kind !== "skills" && file !== "AGENTS.md" && (
        <span className="truncate text-xs text-muted-foreground-3">{file}</span>
      )}
      <span className="ml-auto flex shrink-0 items-baseline gap-2 tabular-nums">
        {cut && (
          <span className="text-xs text-muted-foreground-2">
            {part.loaded === 0 ? "Left out to fit" : "Cut to fit"}
          </span>
        )}
        <span className={faint ? "text-muted-foreground-3" : "text-foreground"}>
          {formatTokens(tokensOf(deferred ? part.chars : part.loaded))}
        </span>
      </span>
    </div>
  );
  if (!deferred) return row;
  return (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipContent>Loaded when Capy opens this repo</TooltipContent>
    </Tooltip>
  );
}

/** Capy's AgentContextPreview: what loads before a thread's first message. */
export function AgentContextPreview({ project }: { project: ScopeProject }) {
  const { orgId } = useAgentOrg();
  const crews = (
    resultValue(useAtomValue(captainsAtom(orgId ?? ""))) ?? []
  ).filter((captain) => captain.projectId === project.id);
  const models = (resultValue(useAtomValue(agentModelsAtom)) ?? []).filter(
    (model, index, all) =>
      all.findIndex((other) => other.id === model.id) === index,
  );
  const [previewAs, setPreviewAs] = useState("you");
  const [modelId, setModelId] = useState<string>();
  const [visible, setVisible] = useState(pageSize);
  const crew = crews.find((captain) => captain.id === previewAs);
  const model =
    models.find((candidate) => candidate.id === modelId) ??
    models.find((candidate) => candidate.defaultFavorite) ??
    models[0];
  const atom = agentContextPreviewAtom(
    agentContextPreviewKey(orgId ?? "", {
      projectId: project.id,
      model: model?.id,
      captainJamId: crew?.id,
    }),
  );
  const result = useAtomValue(atom);
  const retry = useAtomRefresh(atom);
  const preview = resultValue(result);
  const failed = preview === undefined && AsyncResult.isFailure(result);
  const { shown, deferred, loaded, rest } = groupParts(preview?.parts ?? []);
  const tokens = preview === undefined ? 0 : tokensOf(preview.used);
  const share =
    preview === undefined ? 0 : windowShare(tokens, preview.contextWindow);
  const asOptions: PickOption[] = [
    { value: "you", label: "As you", icon: <UserIcon /> },
    ...crews.map((captain) => ({
      value: captain.id,
      label: `As ${captain.name} crew`,
      icon: <CaptainAvatar captain={captain} size="2xs" />,
    })),
  ];
  return (
    <SettingsSection
      id="instructions-preview"
      title="Loaded before the first message"
      action={
        <div className="flex items-center gap-1">
          <PickMenu
            label="Preview as"
            value={previewAs}
            onChange={setPreviewAs}
            options={asOptions}
          />
          <PickMenu
            label="Model"
            value={model?.id ?? ""}
            onChange={setModelId}
            options={models.map((option) => ({
              value: option.id,
              label: option.name,
              icon: <ProviderMark provider={option.provider} />,
            }))}
          />
        </div>
      }
    >
      <Card rows>
        {failed ? (
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-muted-foreground-1">
              Could not build this preview
            </span>
            <Button variant="ghost" size="sm" onClick={retry}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-4 py-3">
            {preview === undefined ? (
              <SkeletonPanel className="h-4 w-56" />
            ) : (
              <span className="truncate text-sm tabular-nums">
                <span className="font-medium text-foreground">
                  About {formatTokens(tokens)} tokens
                </span>
                {model !== undefined && (
                  <span className="text-muted-foreground-2">
                    , {share < 0.1 ? "under 0.1" : Number(share.toFixed(1))}% of
                    the {formatTokens(preview.contextWindow)} context window
                  </span>
                )}
              </span>
            )}
            <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-secondary">
              {preview !== undefined &&
                preview.used > 0 &&
                shown
                  .filter((part) => part.loaded > 0)
                  .map((part) => (
                    <div
                      key={part.kind + part.label}
                      className={cx("h-full", partColor[part.kind])}
                      style={{
                        width: `${(part.loaded / preview.used) * 100}%`,
                      }}
                    />
                  ))}
            </div>
          </div>
        )}
        {!failed && (
          <div className="flex flex-col py-1">
            {preview === undefined
              ? [0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex h-8 items-center px-4">
                    <SkeletonPanel className="h-3.5 w-48" />
                  </div>
                ))
              : [
                  ...loaded.map((part) => (
                    <PartRow key={part.kind + part.label} part={part} />
                  )),
                  ...deferred
                    .slice(0, visible)
                    .map((part) => <PartRow key={part.label} part={part} />),
                  ...(deferred.length > visible
                    ? [
                        <div
                          key="more"
                          className="flex h-8 items-center pl-11.5"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setVisible((count) => count + pageSize)
                            }
                          >
                            Show {Math.min(pageSize, deferred.length - visible)}{" "}
                            more
                          </Button>
                        </div>,
                      ]
                    : []),
                  ...rest.map((part) => (
                    <PartRow key={part.kind + part.label} part={part} />
                  )),
                ]}
          </div>
        )}
      </Card>
    </SettingsSection>
  );
}

/** Capy's ProviderIcon fallback: the provider's initial on a tile. */
function ProviderMark({ provider }: { provider: string }) {
  return (
    <span className="flex size-(--icon-base) items-center justify-center rounded-(--radius-inner) bg-popover-hover text-2xs font-medium text-muted-foreground">
      {provider.charAt(0).toUpperCase()}
    </span>
  );
}
