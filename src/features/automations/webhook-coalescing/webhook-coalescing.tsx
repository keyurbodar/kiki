import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  defaultWebhookCoalescing,
  validateWebhookCoalescing,
  type WebhookCoalescingConfig,
} from "./coalescing";

export type WebhookCoalescingProps = {
  value: WebhookCoalescingConfig | undefined;
  onChange: (value: WebhookCoalescingConfig | undefined) => void;
};

export function WebhookCoalescing({ value, onChange }: WebhookCoalescingProps) {
  const error = validateWebhookCoalescing(value);
  return (
    <div className="-mx-4">
      <SettingsRow
        label="Group events"
        description="Run grouped events together once the wait time or event limit is reached"
      >
        <Switch
          aria-label="Group events"
          checked={value !== undefined}
          onCheckedChange={(checked) =>
            onChange(checked ? defaultWebhookCoalescing : undefined)
          }
        />
      </SettingsRow>
      {value === undefined ? null : (
        <>
          <SettingsRow
            label="Wait time"
            description="How long to keep collecting after the first event, then run them all together"
            className="py-2"
          >
            <Input
              aria-label="Wait time in seconds"
              type="number"
              min={1}
              max={3600}
              step={1}
              className="w-20"
              value={value.max_wait_seconds || ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  max_wait_seconds: Number(event.target.value),
                })
              }
            />
            <span className="w-12 text-xs font-normal text-muted-foreground-2">
              seconds
            </span>
          </SettingsRow>
          <SettingsRow
            label="Event limit"
            description="Start early once this many events have arrived"
            className="py-2"
          >
            <Input
              aria-label="Event limit"
              type="number"
              min={2}
              max={100}
              step={1}
              className="w-20"
              value={value.max_events || ""}
              onChange={(event) =>
                onChange({ ...value, max_events: Number(event.target.value) })
              }
            />
            <span className="w-12 text-xs font-normal text-muted-foreground-2">
              events
            </span>
          </SettingsRow>
          {error === undefined ? null : (
            <p
              role="alert"
              className="px-4 py-2 text-sm font-normal text-destructive"
            >
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
