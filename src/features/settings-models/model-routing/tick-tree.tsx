import { type KeyboardEvent, useState } from "react";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { ChevronRightGlyph, LockGlyphIcon } from "./glyphs.tsx";
import { ProviderIcon } from "./provider-icon.tsx";
import { formatContext, labName, labRank } from "./routing.ts";
import type { LabTicks, TickChange } from "./types.ts";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export function LockGlyph({ reason }: { reason: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="img"
            aria-label={reason}
            className="flex size-6 shrink-0 items-center justify-center text-muted-foreground-2"
          >
            <LockGlyphIcon className="size-(--icon-xs)" />
          </span>
        }
      />
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

const blurOnCommit = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Escape" || event.key === "Enter") {
    event.stopPropagation();
    event.currentTarget.blur();
  }
};

export const initialExpandedLabs = (ticks: ReadonlyArray<LabTicks>) =>
  new Set(
    ticks.length === 1 ||
      ticks.reduce((sum, lab) => sum + lab.models.length, 0) <= 12
      ? ticks.map((lab) => lab.lab)
      : [],
  );

export const labState = (lab: LabTicks) => {
  const on = lab.models.filter((m) => m.ticked).length;
  return lab.ticked && on === lab.models.length
    ? "on"
    : !lab.ticked && on === 0
      ? "off"
      : "mixed";
};

export const labCount = (lab: LabTicks) => {
  const on = lab.models.filter((m) => m.ticked).length;
  const total = lab.models.length;
  return labState(lab) === "on" || (lab.lab === "custom" && on === total)
    ? `${total}`
    : on === total
      ? `${on}, new ones left out`
      : `${on} of ${total}`;
};

export type TickTreeProps = {
  ticks: ReadonlyArray<LabTicks>;
  via?: string;
  connection?: string;
  editable: boolean;
  reason?: string;
  busy?: boolean;
  lockedModels?: ReadonlyArray<string>;
  lockReason?: string;
  onTick: (change: TickChange) => void;
  onContext?: (model: string, context: number | undefined) => void;
  onEdit?: (model: string) => void;
};

export function TickTree({
  ticks,
  via,
  connection,
  editable,
  reason,
  busy,
  lockedModels,
  lockReason,
  onTick,
  onContext,
  onEdit,
}: TickTreeProps) {
  const [editing, setEditing] = useState<string>();
  const [expanded, setExpanded] = useState(() => initialExpandedLabs(ticks));
  const toggle = (lab: string) => {
    const next = new Set(expanded);
    if (next.has(lab)) next.delete(lab);
    else next.add(lab);
    setExpanded(next);
  };
  return (
    <div className="flex flex-col">
      {!editable && reason !== undefined ? (
        <span className="pb-1 text-xs font-normal text-muted-foreground-2">
          {reason}
        </span>
      ) : null}
      {ticks
        .toSorted((a, b) => labRank(a.lab) - labRank(b.lab))
        .map((lab) => {
          const state = labState(lab);
          const open =
            expanded.has(lab.lab) ||
            (onContext !== undefined &&
              lab.models.some(
                (m) =>
                  m.custom === true &&
                  (m.context === undefined || editing === m.model),
              ));
          const name =
            lab.lab === "custom" && connection !== undefined
              ? connection
              : labName(lab.lab);
          return (
            <div key={lab.lab} className="flex flex-col">
              <div className="flex h-8 items-center gap-1.5 text-sm">
                <Checkbox
                  checked={state === "on"}
                  indeterminate={state === "mixed"}
                  disabled={!editable || busy === true}
                  title={reason}
                  aria-label={`Every ${name} model`}
                  onCheckedChange={(checked) =>
                    onTick({ lab: lab.lab, ticked: checked === true })
                  }
                />
                <span
                  className={cx(
                    "flex shrink-0",
                    state === "off"
                      ? "text-muted-foreground-3"
                      : "text-foreground",
                  )}
                >
                  <ProviderIcon
                    provider={lab.lab === "custom" ? name : lab.lab}
                    className="size-4"
                  />
                </span>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none focus-visible:outline-ring-inset"
                  aria-expanded={open}
                  onClick={() => toggle(lab.lab)}
                >
                  <span
                    className={cx(
                      "min-w-0 flex-1 truncate",
                      state === "off"
                        ? "text-muted-foreground-2"
                        : "text-foreground",
                    )}
                  >
                    {`Every ${name} model${via === undefined ? "" : ` on ${via}`}`}
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground-3">
                    {labCount(lab)}
                    <ChevronRightGlyph
                      className={cx(
                        "size-(--icon-xs) transition-transform duration-fast",
                        open && "rotate-90",
                      )}
                    />
                  </span>
                </button>
              </div>
              {open
                ? lab.models.map((model) => {
                    const locked = lockedModels?.includes(model.model) === true;
                    const editingContext =
                      model.custom === true &&
                      onContext !== undefined &&
                      (model.context === undefined || editing === model.model);
                    const detail = [
                      model.providerModelId === undefined ||
                      model.providerModelId === model.model ||
                      model.providerModelId === model.entryId
                        ? undefined
                        : model.providerModelId,
                      model.context === undefined || editingContext
                        ? undefined
                        : `${formatContext(model.context)} context`,
                    ]
                      .filter((part) => part !== undefined)
                      .join(", ");
                    return (
                      <div
                        key={model.model}
                        className="flex h-8 items-center gap-1.5 pl-5.5 text-sm"
                      >
                        <Checkbox
                          checked={model.ticked}
                          disabled={!editable || busy === true || locked}
                          title={locked ? lockReason : reason}
                          aria-label={model.name}
                          onCheckedChange={(checked) =>
                            onTick({
                              lab: lab.lab,
                              model: model.model,
                              ticked: checked === true,
                            })
                          }
                        />
                        <span
                          className={cx(
                            "min-w-0 flex-1 truncate",
                            model.ticked
                              ? "text-foreground"
                              : "text-muted-foreground-2",
                          )}
                        >
                          {model.name}
                          {detail === "" ? null : model.custom === true &&
                            onEdit === undefined &&
                            onContext !== undefined &&
                            model.context !== undefined ? (
                            <>
                              {" "}
                              <button
                                type="button"
                                className="cursor-pointer text-xs font-normal text-muted-foreground-3 outline-none hover:text-foreground focus-visible:text-foreground"
                                aria-label={`Edit context window of ${model.name}`}
                                onClick={() => setEditing(model.model)}
                              >
                                {`(${detail})`}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-normal text-muted-foreground-3">
                              {` (${detail})`}
                            </span>
                          )}
                        </span>
                        {editingContext ? (
                          <Input
                            type="number"
                            inputMode="numeric"
                            size="xs"
                            aria-label={`Context window of ${model.name}`}
                            placeholder="Context window"
                            className="w-32 shrink-0"
                            value={model.context ?? ""}
                            autoFocus={editing === model.model}
                            onFocus={() => {
                              setEditing(model.model);
                              if (!expanded.has(lab.lab))
                                setExpanded(new Set([...expanded, lab.lab]));
                            }}
                            onBlur={() => setEditing(undefined)}
                            onKeyDown={blurOnCommit}
                            onChange={(event) => {
                              const tokens = Number(event.currentTarget.value);
                              onContext?.(
                                model.model,
                                Number.isInteger(tokens) && tokens > 0
                                  ? tokens
                                  : undefined,
                              );
                            }}
                          />
                        ) : null}
                        {model.custom === true && onEdit !== undefined ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Edit ${model.name}`}
                            title="Edit"
                            disabled={!editable || busy === true}
                            onClick={() => onEdit(model.model)}
                          >
                            <Icon name="pencil" />
                          </Button>
                        ) : null}
                        {locked && lockReason !== undefined ? (
                          <LockGlyph reason={lockReason} />
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
          );
        })}
    </div>
  );
}
