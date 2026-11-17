import { toast } from "sonner";
import type { ColorMode } from "@/tokens/theme";
import {
  appearanceActions,
  type ColorThemeSelection,
  type SyncMode,
  useAppearance,
} from "../model/appearance-store";
import { SelectField } from "../select-field";
import { SettingsCard, SettingsField } from "../settings-kit";
import { ThemePreview, type ThemePreviewSource } from "../theme-preview";

const MODES: ReadonlyArray<{ value: ColorMode; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SYNC_ITEMS: Record<SyncMode, string> = {
  synced: "Synced",
  device: "This device only",
};

const previewSource = (
  theme: ColorThemeSelection,
  side: "light" | "dark",
): ThemePreviewSource =>
  theme.kind === "custom" ? { kind: "palette", palette: theme[side] } : theme;

const modeButton =
  "relative block aspect-[4/3] w-20 min-w-0 shrink cursor-pointer overflow-hidden rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-2 outline-none disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-ring-inset aria-pressed:border-primary";

export function ModeCard() {
  const { preferences, syncMode, colorTheme } = useAppearance();
  return (
    <section className="flex flex-col gap-3">
      <div className="-mx-4 flex flex-col gap-3">
        <SettingsCard>
          <SettingsField id="theme" label="Mode" wrap>
            <div role="group" aria-label="Mode" className="flex min-w-0 gap-4">
              {MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  aria-label={mode.label}
                  title={mode.label}
                  aria-pressed={preferences.mode === mode.value}
                  className={modeButton}
                  onClick={() =>
                    appearanceActions.updatePreferences({ mode: mode.value })
                  }
                >
                  {mode.value === "system" ? (
                    <>
                      <span className="absolute inset-0 [clip-path:inset(0_50%_0_0)]">
                        <ThemePreview
                          side="light"
                          source={previewSource(colorTheme, "light")}
                        />
                      </span>
                      <span className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                        <ThemePreview
                          side="dark"
                          source={previewSource(colorTheme, "dark")}
                        />
                      </span>
                    </>
                  ) : (
                    <ThemePreview
                      side={mode.value}
                      source={previewSource(colorTheme, mode.value)}
                    />
                  )}
                </button>
              ))}
            </div>
          </SettingsField>
          <SettingsField
            id="appearance-sync"
            label="Appearance sync"
            description={
              syncMode === "device"
                ? "This device keeps its own appearance"
                : "Changes apply across your devices"
            }
          >
            <SelectField
              label="Appearance sync"
              value={syncMode}
              items={SYNC_ITEMS}
              onChange={(next) => {
                try {
                  appearanceActions.setSyncMode(next);
                } catch {
                  toast.error("Could not change appearance sync");
                }
              }}
            />
          </SettingsField>
        </SettingsCard>
      </div>
    </section>
  );
}
