import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from ".";

const tones = ["default", "muted", "section"] as const;

export function CollapsibleSpecimen() {
  return (
    <div className="flex w-80 flex-col gap-4 p-6">
      {tones.map((tone) => (
        <Collapsible key={tone} defaultOpen={tone !== "muted"}>
          <CollapsibleTrigger tone={tone} block={tone === "section"}>
            {tone}
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <p className="py-2 text-sm text-muted-foreground-2">
              Panel content for the {tone} tone.
            </p>
          </CollapsiblePanel>
        </Collapsible>
      ))}
    </div>
  );
}
