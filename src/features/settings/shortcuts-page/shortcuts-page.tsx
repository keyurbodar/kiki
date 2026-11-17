/** biome-ignore-all lint/a11y/useSemanticElements: Capy renders the shortcuts table as an ARIA grid of divs with CSS subgrid */
/** biome-ignore-all lint/a11y/useFocusableInteractive: rows and cells are static; the buttons inside them take focus */
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { SettingsConfirmDialog } from "@/features/settings/confirm-dialog";
import { useLocalPreference } from "@/features/settings/general-page/local-preference";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Kbd } from "@/primitives/kbd";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow } from "@/primitives/settings-row";
import {
  bindingGlyphs,
  captureBinding,
  captureDigitBinding,
  commandCatalog,
  conflictReason,
  desktopCommands,
  digitCommands,
  effectiveBindings,
  type KeybindingCommand,
  type KeybindOverrides,
  normalizeBinding,
  sequenceCommands,
} from "./keybindings";
import { whenLabels } from "./when-labels";

const voiceModes = { hold: "Hold to talk", toggle: "Press to start and stop" };
type VoiceMode = keyof typeof voiceModes;
const isVoiceMode = (value: unknown): value is VoiceMode =>
  value === "hold" || value === "toggle";

const isOverrides = (value: unknown): value is KeybindOverrides =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function applyCapture(
  overrides: KeybindOverrides,
  command: KeybindingCommand,
  binding: string,
): KeybindOverrides {
  const rest = { ...overrides };
  delete rest[command.command];
  const isDefault =
    command.defaults.length === 1 &&
    command.defaults[0] !== undefined &&
    normalizeBinding(command.defaults[0]) === binding;
  return isDefault ? rest : { ...rest, [command.command]: [binding] };
}

const isDesktop = () =>
  typeof window !== "undefined" &&
  (window as { capyDesktop?: unknown }).capyDesktop !== undefined;

export function ShortcutsPage() {
  const [overrides, setOverrides] = useLocalPreference<KeybindOverrides>(
    "kiki:keybinds",
    {},
    isOverrides,
  );
  const [voiceMode, setVoiceMode] = useLocalPreference<VoiceMode>(
    "capy-web:voice-shortcut-mode",
    "hold",
    isVoiceMode,
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [leader, setLeader] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [query, setQuery] = useState("");

  const save = (next: KeybindOverrides) => {
    setOverrides(next);
    toast.success("Shortcuts saved");
  };
  const stopEditing = () => {
    setLeader(null);
    setEditing(null);
  };
  const matches = (c: KeybindingCommand) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase());
  const general = commandCatalog
    .filter((c) => !desktopCommands.has(c.command))
    .filter(matches);
  const desktop = isDesktop()
    ? commandCatalog
        .filter((c) => desktopCommands.has(c.command))
        .filter(matches)
    : [];
  const bindings = effectiveBindings(overrides);
  const hasOverrides = Object.keys(overrides).length > 0;

  const onCapture =
    (command: KeybindingCommand) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") return stopEditing();
      if (e.key === "Backspace") {
        save({ ...overrides, [command.command]: null });
        return stopEditing();
      }
      const digits = digitCommands.has(command.command);
      if (digits && !e.metaKey && !e.ctrlKey && !e.altKey) return;
      const chord = digits ? captureDigitBinding(e) : captureBinding(e);
      if (chord === null) return;
      const bare = !e.metaKey && !e.ctrlKey && !e.altKey;
      if (sequenceCommands.has(command.command) && leader === null && bare)
        return setLeader(chord);
      const binding = leader === null ? chord : `${leader} ${chord}`;
      const problem = conflictReason(binding, command.command, bindings);
      if (problem !== null) {
        toast.error(problem);
        return stopEditing();
      }
      save(applyCapture(overrides, command, binding));
      stopEditing();
    };

  const group = (label: string, commands: KeybindingCommand[]) => (
    <>
      <div
        role="row"
        className="relative col-span-full mb-0.5 grid h-8 grid-cols-subgrid items-center [--table-lead-bg:var(--section)]"
      >
        <div className="absolute inset-y-0 -inset-x-2 rounded-(--radius-card) bg-section" />
        <span className="relative flex items-center text-xs font-medium text-muted-foreground-1 col-span-full">
          <span className="flex items-center gap-1.5 max-md:sticky max-md:left-0">
            {label}
            <span className="text-muted-foreground-3 tabular-nums">
              {commands.length}
            </span>
          </span>
        </span>
      </div>
      {commands.map((command) => {
        const keys = bindings
          .filter((b) => b.command === command.command)
          .map((b) => b.key);
        const overridden = overrides[command.command] !== undefined;
        return (
          <div
            role="row"
            key={command.command}
            className="col-span-full grid grid-cols-subgrid items-center"
          >
            <div role="cell" className="text-sm font-medium text-foreground">
              {command.label}
            </div>
            <div role="cell">
              {editing === command.command ? (
                <Input
                  // biome-ignore lint/a11y/noAutofocus: Capy focuses the recorder when editing starts
                  autoFocus
                  data-keybinding-capture=""
                  size="sm"
                  placeholder={
                    leader === null
                      ? digitCommands.has(command.command)
                        ? "Press a modifier + any digit"
                        : "Press shortcut"
                      : `${bindingGlyphs(leader)?.join("") ?? leader} then…`
                  }
                  aria-label={`Record shortcut for ${command.label}`}
                  value=""
                  readOnly
                  className={
                    digitCommands.has(command.command) ? "w-56" : "w-40"
                  }
                  onKeyDown={onCapture(command)}
                  onBlur={stopEditing}
                />
              ) : (
                <button
                  type="button"
                  aria-label={`Edit shortcut for ${command.label}`}
                  className="group/binding -ml-1.5 flex h-7 cursor-pointer items-center gap-1.5 rounded px-1.5 transition-colors duration-100 outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset"
                  onClick={() => setEditing(command.command)}
                >
                  {keys.length > 0 ? (
                    keys.map((key) => (
                      <span key={key} className="flex items-center gap-1">
                        {bindingGlyphs(key)?.map((glyph, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: glyphs repeat within one binding
                          <Kbd key={i} variant="chip">
                            {glyph}
                          </Kbd>
                        ))}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground-3">
                      Unassigned
                    </span>
                  )}
                  <span className="text-xs font-normal text-transparent transition-colors duration-100 group-hover/binding:text-muted-foreground-2 group-focus-visible/binding:text-muted-foreground-2">
                    Edit
                  </span>
                </button>
              )}
            </div>
            <div role="cell" className="text-xs text-muted-foreground-1">
              {whenLabels[command.command] ?? "Always"}
            </div>
            <div role="cell" className="flex justify-end">
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${command.label}`}
                    />
                  }
                >
                  <Icon name="settings-slider-hor" size="sm" />
                </MenuTrigger>
                <MenuContent align="end" className="w-44">
                  <MenuItem
                    disabled={!overridden}
                    onClick={() => {
                      const rest = { ...overrides };
                      delete rest[command.command];
                      save(rest);
                    }}
                  >
                    Reset to default
                  </MenuItem>
                  <MenuItem
                    disabled={keys.length === 0}
                    onClick={() =>
                      save({ ...overrides, [command.command]: null })
                    }
                  >
                    Unassign
                  </MenuItem>
                </MenuContent>
              </Menu>
            </div>
          </div>
        );
      })}
    </>
  );

  return (
    <SettingsPage title="Shortcuts" width="wide">
      <SettingsSection title="Voice input">
        <Card rows>
          <SettingsRow
            id="voice-shortcut-mode"
            label="Voice input shortcut"
            description={
              voiceMode === "hold"
                ? "Hold the shortcut while you talk, release to insert the text"
                : "Press the shortcut to start, press it again to insert the text"
            }
          >
            <MenuSelect
              items={voiceModes}
              value={voiceMode}
              onValueChange={(v) => isVoiceMode(v) && setVoiceMode(v)}
            >
              <MenuSelectTrigger className="justify-between w-52">
                <MenuSelectValue />
              </MenuSelectTrigger>
              <MenuSelectContent>
                {(Object.keys(voiceModes) as VoiceMode[]).map((mode) => (
                  <MenuSelectItem key={mode} value={mode}>
                    {voiceModes[mode]}
                  </MenuSelectItem>
                ))}
              </MenuSelectContent>
            </MenuSelect>
          </SettingsRow>
        </Card>
      </SettingsSection>
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-6">
          <div className="w-full max-w-75">
            <span
              data-slot="input-group"
              className="relative inline-flex w-full"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-icon-muted [&_svg]:size-(--icon-sm) left-2.5"
              >
                <Icon name="search-menu" size="sm" />
              </span>
              <Input
                placeholder="Search shortcuts"
                aria-label="Search shortcuts"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </span>
          </div>
          <Button
            variant="ghost"
            size="base"
            disabled={!hasOverrides}
            onClick={() => setResetOpen(true)}
          >
            Reset all
          </Button>
        </div>
        <div className="-mx-4">
          <div
            role="table"
            className="grid grid-cols-[minmax(var(--table-lead-min),1.4fr)_minmax(var(--table-fluid-min),1.2fr)_minmax(var(--table-fluid-min),1fr)_auto]"
          >
            <div
              role="row"
              className="col-span-full grid h-8 grid-cols-subgrid items-center"
            >
              <div role="columnheader">Command</div>
              <div role="columnheader">Keybinding</div>
              <div role="columnheader">When</div>
              <div role="columnheader" aria-hidden="true" />
            </div>
            {group("General", general)}
            {desktop.length > 0 && group("Desktop", desktop)}
            {general.length === 0 && desktop.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-12 text-sm font-normal text-muted-foreground-2">
                No shortcuts match
              </div>
            )}
          </div>
        </div>
      </section>
      <SettingsConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all shortcuts?"
        description="Every command returns to its default keybinding"
        confirmLabel="Reset all"
        onConfirm={() => save({})}
      />
    </SettingsPage>
  );
}
