import type { MachineLifetime } from "@/features/thread/device-chip";
import { LoadingButton } from "@/lib/loading-button";

export type MachineWakeButtonProps = { lifetime: MachineLifetime };

export function MachineWakeButton({ lifetime }: MachineWakeButtonProps) {
  if (lifetime.machine != null && lifetime.machine.device !== null) return null;
  return (
    <LoadingButton
      variant="outline"
      size="xs"
      loading={lifetime.waking}
      onClick={lifetime.wake}
    >
      Wake machine
    </LoadingButton>
  );
}
