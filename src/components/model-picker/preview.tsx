import { useState } from "react";
import { Button } from "@/primitives/button";
import { defaultSelection, type ModelSelection } from "./catalog";
import { ModelPicker } from "./model-picker";
import { sampleCatalog } from "./sample-catalog";

/**
 * Dev-only specimen for the model picker, mounted at /__model-picker so the
 * popover can be screenshotted and compared against Capy's composer frame.
 */
export function ModelPickerPreview() {
  const [value, setValue] = useState<ModelSelection>(defaultSelection);
  return (
    <div className="flex min-h-dvh flex-col gap-10 bg-background p-10 font-sans text-foreground">
      <div className="flex w-2xl max-w-full flex-col gap-2">
        <span className="font-mono text-muted-foreground-2 text-xs">
          composer footer, picker open
        </span>
        <div
          data-slot="composer"
          className="rounded-panel border-hairline border-border-2 bg-panel p-3 shadow-panel"
        >
          <div className="flex min-h-24 items-start px-1 py-2 text-muted-foreground-3 text-sm">
            Ask Capy to build something
          </div>
          <div className="flex items-center gap-2">
            <ModelPicker
              entries={sampleCatalog}
              value={value}
              onChange={setValue}
              defaultOpen
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-mono text-muted-foreground-2 text-xs">
          closed
        </span>
        <div className="flex items-center gap-6">
          <ModelPicker
            entries={sampleCatalog}
            value={value}
            onChange={setValue}
          />
          <ModelPicker
            entries={sampleCatalog}
            value={defaultSelection}
            loading
          />
          <ModelPicker
            entries={sampleCatalog}
            value={value}
            onChange={setValue}
            inherit={{
              label: "Inherit from thread",
              value: "Claude Opus 5.5",
              active: false,
              onSelect: () => {},
            }}
          />
          <ModelPicker
            entries={sampleCatalog}
            value={{ ...defaultSelection, modelId: "missing/model" }}
          />
          <div data-preview="child-trigger">
            <ModelPicker
              entries={sampleCatalog}
              value={value}
              onChange={setValue}
            >
              <Button variant="ghost" size="xs" aria-label="Automation model">
                Default model
              </Button>
            </ModelPicker>
          </div>
        </div>
      </div>
    </div>
  );
}
