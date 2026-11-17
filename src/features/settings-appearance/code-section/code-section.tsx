import { SettingsSection } from "@/components/settings-page";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import {
  appearanceActions,
  type CodeFontSize,
  type DiffColors,
  type DiffStyle,
  type HiddenCategory,
  useAppearance,
} from "../model/appearance-store";
import { MultiSelectField, SelectField } from "../select-field";

const FONT_SIZES: Record<CodeFontSize, string> = {
  default: "Default",
  11: "11 px",
  12: "12 px",
  13: "13 px",
  14: "14 px",
  15: "15 px",
  16: "16 px",
};

const DIFF_STYLES: Record<DiffStyle, string> = {
  unified: "Unified",
  split: "Split",
};

const DIFF_COLORS: Record<DiffColors, string> = {
  "red-green": "Red/green",
  "blue-orange": "Blue/orange",
};

const HIDDEN: Record<HiddenCategory, string> = {
  tests: "Tests",
  database: "Database",
  generated: "Generated",
};

type PreviewLine = {
  readonly number: number;
  readonly kind: "context" | "del" | "add";
  readonly text: string;
};

const PREVIEW: ReadonlyArray<PreviewLine> = [
  {
    number: 1,
    kind: "context",
    text: "export function add(a: number, b: number) {",
  },
  { number: 2, kind: "del", text: "  return a - b;" },
  { number: 2, kind: "add", text: "  return a + b;" },
  { number: 3, kind: "context", text: "}" },
];

const lineClass: Record<PreviewLine["kind"], string> = {
  context: "flex",
  del: "flex bg-(--diff-del-wash) shadow-[inset_--spacing(0.75)_0_var(--diff-del)]",
  add: "flex bg-(--diff-add-wash) shadow-[inset_--spacing(0.75)_0_var(--diff-add)]",
};

const numberClass: Record<PreviewLine["kind"], string> = {
  context: "w-10 shrink-0 pr-3 text-right text-muted-foreground-3",
  del: "w-10 shrink-0 pr-3 text-right text-diff-del",
  add: "w-10 shrink-0 pr-3 text-right text-diff-add",
};

function CodePreview({ fontSize }: { fontSize: CodeFontSize }) {
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: Capy labels the preview container
    <div
      aria-label="Code preview"
      className="overflow-hidden rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1 bg-card py-1 font-mono text-code-block"
      style={
        fontSize === "default"
          ? undefined
          : { fontSize: `${Number(fontSize) / 16}rem` }
      }
    >
      {PREVIEW.map((line) => (
        <div
          key={`${line.kind}-${line.number}`}
          className={lineClass[line.kind]}
        >
          <span className={numberClass[line.kind]}>{line.number}</span>
          <span className="whitespace-pre text-foreground">{line.text}</span>
        </div>
      ))}
    </div>
  );
}

export function CodeSection() {
  const { preferences, diffColors } = useAppearance();
  const hidden = (Object.keys(HIDDEN) as HiddenCategory[]).filter(
    (key) => preferences.hidden[key],
  );
  return (
    <>
      <SettingsSection title="Code">
        <Card rows>
          <SettingsRow
            id="code-font-size"
            label="Code font size"
            description="Text size in diffs, files, and code blocks"
          >
            <SelectField
              label="Code font size"
              className="w-32"
              value={preferences.codeFontSize}
              items={FONT_SIZES}
              onChange={(codeFontSize) =>
                appearanceActions.updatePreferences({ codeFontSize })
              }
            />
          </SettingsRow>
          <SettingsRow
            id="diff-view"
            label="Diff view"
            description="How code changes render in threads"
          >
            <SelectField
              label="Diff view"
              className="w-32"
              value={preferences.diffStyle}
              items={DIFF_STYLES}
              onChange={(diffStyle) =>
                appearanceActions.updatePreferences({ diffStyle })
              }
            />
          </SettingsRow>
          <SettingsRow
            id="diff-colors"
            label="Diff colors"
            description="Blue/orange is the accessible alternative for red-green color blindness"
          >
            <SelectField
              label="Diff colors"
              className="w-32"
              value={diffColors}
              items={DIFF_COLORS}
              onChange={appearanceActions.setDiffColors}
            />
          </SettingsRow>
        </Card>
        <CodePreview fontSize={preferences.codeFontSize} />
      </SettingsSection>
      <SettingsSection title="Hidden files">
        <Card rows>
          <SettingsRow
            id="hidden-in-pull-requests"
            label="Hidden in pull requests"
            description="Greyed out and left out of the line count"
          >
            <MultiSelectField
              label="Hidden in pull requests"
              className="w-56"
              value={hidden}
              items={HIDDEN}
              onChange={(next) =>
                appearanceActions.updatePreferences({
                  hidden: {
                    tests: next.includes("tests"),
                    database: next.includes("database"),
                    generated: next.includes("generated"),
                  },
                })
              }
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
    </>
  );
}
