import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { SettingsField } from "./settings-field";

export function SettingsLoadFailedRow({
  label,
  onRetry,
}: {
  label: string;
  onRetry: () => void;
}) {
  return (
    <SettingsField
      label={label}
      description="Check your connection and try again"
      descriptionTone="strong"
    >
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </SettingsField>
  );
}

export function SettingsLoadingCard() {
  return (
    <Card>
      <div className="flex flex-col gap-2 p-4">
        <SkeletonPanel className="h-4 w-2/3" />
        <SkeletonPanel className="h-4 w-1/2" />
      </div>
    </Card>
  );
}
