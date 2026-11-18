import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { MenuGroup, MenuLabel } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";

export type CrewDevice = {
  readonly id: string;
  readonly name: string;
  readonly connected: boolean;
};

const mutedIconClass = "size-(--icon-sm) shrink-0 text-muted-foreground-3";
const checkIconClass = "size-(--icon-sm) shrink-0 text-foreground";
const dotClass = "size-1.5 shrink-0 rounded-full bg-success";

export const crewDeviceLabel = (
  value: string | null,
  devices: ReadonlyArray<CrewDevice>,
  disabled: boolean,
  savedName: string | undefined,
) =>
  value === null
    ? "Cloud"
    : (devices.find((device) => device.id === value)?.name ??
      (disabled ? savedName : undefined) ??
      "Device unavailable");

export type CrewDeviceSelectProps = {
  value: string | null;
  savedName?: string;
  devices: ReadonlyArray<CrewDevice>;
  disabled?: boolean;
  onChange: (deviceId: string | null) => void;
};

/** Capy's CrewDeviceSelect: where a Captain's crew threads run. */
export function CrewDeviceSelect({
  value,
  savedName,
  devices,
  disabled = false,
  onChange,
}: CrewDeviceSelectProps) {
  const selected = devices.find((device) => device.id === value);
  const label = crewDeviceLabel(value, devices, disabled, savedName);
  if (disabled)
    return (
      <span className="min-w-0 truncate text-sm text-muted-foreground-1">
        {label}
      </span>
    );
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button
            variant="bare"
            size="auto-sm"
            aria-label="Crew runs on"
            className="-m-1 p-1"
          >
            {value === null ? (
              <Icon
                name="cloud"
                className="size-(--icon-sm) translate-y-hairline"
              />
            ) : null}
            <span className="min-w-0 truncate">{label}</span>
            {selected?.connected === true ? (
              <span aria-hidden className={dotClass} />
            ) : null}
            <Icon name="chevron-down-small" className={mutedIconClass} />
          </Button>
        }
      />
      <ResponsiveMenuContent align="end" className="w-72">
        <MenuGroup>
          <MenuLabel>Crew runs on</MenuLabel>
        </MenuGroup>
        <ResponsiveMenuItem onClick={() => onChange(null)}>
          <Icon name="cloud" size="sm" />
          <span className="min-w-0 flex-1 truncate">Cloud</span>
          {value === null ? (
            <Icon name="checkmark-1" className={`ml-auto ${checkIconClass}`} />
          ) : null}
        </ResponsiveMenuItem>
        {devices.map((device) => (
          <ResponsiveMenuItem
            key={device.id}
            onClick={() => onChange(device.id)}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="min-w-0 truncate">{device.name}</span>
              {device.connected ? (
                <span aria-hidden className={dotClass} />
              ) : null}
            </span>
            {value === device.id ? (
              <Icon name="checkmark-1" className={checkIconClass} />
            ) : null}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
