export type MachineSummary = {
  readonly machineId: string;
  readonly state:
    | "creating"
    | "waking"
    | "asleep"
    | "gone"
    | "awake"
    | "wind_down";
  readonly device?: string | null;
};

export function desktopCopy(
  machine: MachineSummary | undefined | null,
  settled: boolean,
) {
  if (machine == null) {
    return settled
      ? { line: "Machine state unavailable", action: "Retry" }
      : undefined;
  }
  if (
    machine.device == null &&
    (machine.state === "asleep" || machine.state === "gone")
  ) {
    return {
      line: machine.state === "gone" ? "Machine stopped" : "Machine is asleep",
      sub:
        machine.state === "gone"
          ? "Wake to start a fresh one, 5 minutes prepaid"
          : "Wake to watch the desktop, 5 minutes prepaid",
    };
  }
  return undefined;
}

export function isLive(
  machine: MachineSummary | undefined | null,
  optimisticAwake: boolean,
): boolean {
  if (machine == null) return false;
  const state = machine.state;
  return (
    state === "awake" ||
    state === "wind_down" ||
    (state === "waking" && optimisticAwake)
  );
}
