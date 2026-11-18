import { toast } from "sonner";
import {
  type MachineHourMeter,
  MachineUsageNote,
} from "@/components/machine-usage";
import { ModelPicker } from "@/components/model-picker";
import {
  formatMachine,
  type MachineSize,
  machineSizes,
} from "@/components/plan-picker/plan-catalog";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { Checkmark, ChevronDownSmall } from "./icons";
import {
  type AddTriggerResult,
  addScheduleTime,
  addTrigger,
  defaultTrigger,
  type EditorForm,
  hasDuplicateSchedules,
  isEventTrigger,
  type ModelChoice,
  type Trigger,
  toggleId,
} from "./model";
import { MultiSelectMenu, type MultiSelectOption } from "./multi-select-menu";
import {
  chevronClass,
  cx,
  menuCheckClass,
  menuLabelClass,
  SectionHeader,
} from "./parts";
import { nextSchedule } from "./schedule";
import { AddTriggerMenu, TriggerRow } from "./triggers";

export const modelLabel = (model: ModelChoice) =>
  (model.id.split("/").at(-1) ?? model.id).replaceAll("-", " ");

export const reasoningLabel = (reasoning: string | null) =>
  reasoning === null || reasoning === ""
    ? null
    : reasoning[0]?.toUpperCase() + reasoning.slice(1);

export const limitsDescription = (triggers: ReadonlyArray<Trigger>) => {
  const grouped = triggers.filter(
    (trigger) => trigger.type === "incoming_webhook",
  ).length;
  if (grouped === 0) return "Extra events are skipped and start no thread";
  if (grouped === triggers.length)
    return "Extra events are skipped and listed in Incoming events under History";
  return "Extra events are skipped, grouped webhook events are listed in Incoming events under History";
};

export const parseMaxRuns = (value: string) => {
  const parsed = Number(value);
  return value === "" || Number.isNaN(parsed) || parsed < 1
    ? null
    : Math.floor(parsed);
};

const machineSizeOf = (value: string | null | undefined): MachineSize | null =>
  value !== null &&
  value !== undefined &&
  (machineSizes as ReadonlyArray<string>).includes(value)
    ? (value as MachineSize)
    : null;

/** The size a run's machine boots at: the automation's own, else the project's. */
export const effectiveMachineSize = (
  value: string | null | undefined,
  projectDefault: string | null | undefined,
): MachineSize | null => machineSizeOf(value) ?? machineSizeOf(projectDefault);

export const machineSizeLabel = (
  value: string | null,
  projectDefault: string | null,
) => {
  const chosen = effectiveMachineSize(value, projectDefault);
  return chosen === null ? "Project default" : formatMachine(chosen);
};

export type EditorSectionsProps = {
  form: EditorForm;
  setForm: (form: EditorForm) => void;
  mixedRunWhen: boolean;
  serviceRunAs: boolean;
  folders: ReadonlyArray<MultiSelectOption>;
  tags: ReadonlyArray<MultiSelectOption>;
  /** The project's machine size, shown as inherited until the automation picks its own. */
  machineSizeDefault?: string | null;
  /** The org's machine-hour allowance; the row leaves its usage line out without it. */
  machineUsage?: MachineHourMeter;
};

type MachineSizeMenuProps = {
  value: string | null;
  projectDefault: string | null;
  onValueChange: (value: string | null) => void;
};

function MachineSizeMenu({
  value,
  projectDefault,
  onValueChange,
}: MachineSizeMenuProps) {
  const chosen = machineSizeOf(value);
  const inherited = machineSizeOf(projectDefault);
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="soft" size="sm" aria-label="Machine size" />}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">
            {machineSizeLabel(value, projectDefault)}
          </span>
          {chosen === null && inherited !== null ? (
            <span className="shrink-0 text-xs text-muted-foreground-2">
              Project
            </span>
          ) : null}
        </span>
        <ChevronDownSmall className={chevronClass} />
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuItem onClick={() => onValueChange(null)}>
          <span className={menuLabelClass}>Project default</span>
          {chosen === null ? (
            <Checkmark className={cx("ml-auto", menuCheckClass)} />
          ) : null}
        </MenuItem>
        <MenuSeparator />
        {machineSizes.map((size) => (
          <MenuItem key={size} onClick={() => onValueChange(size)}>
            <span className={menuLabelClass}>{formatMachine(size)}</span>
            {chosen === size ? (
              <Checkmark className={cx("ml-auto", menuCheckClass)} />
            ) : null}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

const applyResult = (
  result: AddTriggerResult,
  form: EditorForm,
  setForm: (form: EditorForm) => void,
) => {
  if (result.kind === "warning") {
    toast.warning(result.title, { description: result.description });
    return;
  }
  setForm({ ...form, triggers: result.triggers });
};

export function EditorSections({
  form,
  setForm,
  mixedRunWhen,
  serviceRunAs,
  folders,
  tags,
  machineSizeDefault = null,
  machineUsage,
}: EditorSectionsProps) {
  const hasEventTriggers = form.triggers.some(isEventTrigger);
  const problems = hasDuplicateSchedules(form.triggers)
    ? ["Two schedules fire at the same times"]
    : [];
  const reasoning =
    form.model === null ? null : reasoningLabel(form.model.reasoning);
  return (
    <>
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Triggers"
          subtitle="Runs when any of these conditions are met"
          action={
            <AddTriggerMenu
              onAdd={(type) =>
                applyResult(
                  addTrigger(form, defaultTrigger(type), nextSchedule),
                  form,
                  setForm,
                )
              }
            />
          }
        />
        <div className="-mx-4 flex flex-col gap-2">
          {form.triggers.length === 0 ? (
            <Card>
              <div className="flex h-16 items-center justify-center text-sm font-normal text-muted-foreground-2">
                Add at least one trigger
              </div>
            </Card>
          ) : (
            <Card rows>
              {form.triggers.map((trigger, index) => (
                <TriggerRow
                  // biome-ignore lint/suspicious/noArrayIndexKey: triggers have no id and Capy keys rows by position
                  key={index}
                  trigger={trigger}
                  onChange={(next) =>
                    setForm({
                      ...form,
                      triggers: form.triggers.map((existing, position) =>
                        position === index ? next : existing,
                      ),
                    })
                  }
                  onAddTime={
                    trigger.type === "schedule"
                      ? () =>
                          applyResult(
                            addScheduleTime(form, index, trigger, nextSchedule),
                            form,
                            setForm,
                          )
                      : undefined
                  }
                  onRemove={() =>
                    setForm({
                      ...form,
                      triggers: form.triggers.filter(
                        (_, position) => position !== index,
                      ),
                    })
                  }
                />
              ))}
            </Card>
          )}
          {problems.map((problem) => (
            <p
              key={problem}
              className="px-4 text-sm font-normal text-destructive"
            >
              {problem}
            </p>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Instructions"
          subtitle="What Capy does when the automation triggers, trigger context is added automatically"
        />
        <Card className="-mx-4">
          <div className="max-h-56 overflow-y-auto overscroll-contain px-3 pt-2 md:scroll-fade-y">
            <textarea
              aria-label="Instructions"
              placeholder="e.g. Triage the new Sentry issue, find the root cause, and open a pull request with a fix"
              className="field-sizing-content block min-h-28 w-full resize-none bg-transparent p-1 text-base font-normal whitespace-pre-wrap text-foreground outline-none placeholder:text-muted-foreground-3"
              value={form.prompt}
              onChange={(event) =>
                setForm({ ...form, prompt: event.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-0.5 px-2 pb-1.5">
            <ModelPicker>
              <Button variant="ghost" size="sm" aria-label="Model">
                <span className="min-w-0 truncate">
                  {form.model === null
                    ? form.runsIn.threadMode === "single"
                      ? "Thread's current model"
                      : "Default model"
                    : modelLabel(form.model)}
                </span>
                {reasoning === null ? null : (
                  <span className="font-normal text-muted-foreground-2">
                    {reasoning}
                  </span>
                )}
                <ChevronDownSmall className={chevronClass} />
              </Button>
            </ModelPicker>
          </div>
        </Card>
      </section>
      {hasEventTriggers ? (
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Only run when"
            subtitle={
              mixedRunWhen
                ? "Each trigger keeps its own condition until you edit this one"
                : "A fast model checks each event against this and skips runs that don't match"
            }
          />
          <Card className="-mx-4">
            <textarea
              aria-label="Only run when"
              placeholder="e.g. This message reports a real product bug"
              className="field-sizing-content block max-h-40 min-h-16 w-full resize-none bg-transparent px-3 py-2 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
              value={form.runWhen}
              onChange={(event) =>
                setForm({ ...form, runWhen: event.target.value })
              }
            />
          </Card>
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Limits" />
        <Card rows className="-mx-4">
          <SettingsRow
            label="Max runs per day"
            description={limitsDescription(form.triggers)}
          >
            <div className="w-28">
              <Input
                type="number"
                min={1}
                className="w-full"
                aria-label="Max runs per day"
                placeholder="No limit"
                value={
                  form.maxRunsPerDay === null ? "" : String(form.maxRunsPerDay)
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxRunsPerDay: parseMaxRuns(event.target.value),
                  })
                }
              />
            </div>
          </SettingsRow>
          <SettingsRow
            label="Machine size"
            description={
              <>
                Compute for each run&apos;s machine, project default when unset
                {machineUsage === undefined ? null : (
                  <MachineUsageNote
                    meter={machineUsage}
                    size={effectiveMachineSize(
                      form.machineSize,
                      machineSizeDefault,
                    )}
                  />
                )}
              </>
            }
          >
            <MachineSizeMenu
              value={form.machineSize}
              projectDefault={machineSizeDefault}
              onValueChange={(machineSize) => setForm({ ...form, machineSize })}
            />
          </SettingsRow>
        </Card>
      </section>
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Organize"
          subtitle="Where each run's thread lands on the board, applied as the owner"
        />
        <Card rows className="-mx-4">
          <SettingsRow
            label="Pin"
            description={
              serviceRunAs
                ? "Needs a human run-as, a service user has no Pinned folder"
                : "Pin each run's thread in the owner's Pinned folder"
            }
          >
            <Switch
              aria-label="Pin"
              checked={form.pin}
              disabled={serviceRunAs}
              onCheckedChange={(pin) => setForm({ ...form, pin })}
            />
          </SettingsRow>
          <SettingsRow
            label="Folders"
            description="File each run's thread into these folders"
          >
            <MultiSelectMenu
              aria-label="Folders"
              placeholder="No folders"
              searchPlaceholder="Search folders"
              emptyLabel="No folders yet"
              selected={form.folderIds}
              options={folders}
              onToggle={(id) =>
                setForm({ ...form, folderIds: toggleId(form.folderIds, id) })
              }
            />
          </SettingsRow>
          <SettingsRow
            label="Tags"
            description={
              serviceRunAs
                ? "Needs a human run-as, a service user cannot assign tags"
                : "Tag each run's thread"
            }
          >
            <MultiSelectMenu
              aria-label="Tags"
              placeholder="No tags"
              searchPlaceholder="Search tags"
              emptyLabel="No tags yet"
              disabled={serviceRunAs}
              selected={form.tagIds}
              options={tags}
              onToggle={(id) =>
                setForm({ ...form, tagIds: toggleId(form.tagIds, id) })
              }
            />
          </SettingsRow>
        </Card>
      </section>
    </>
  );
}
