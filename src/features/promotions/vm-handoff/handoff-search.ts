export type VmHandoffSearch = {
  jamId?: string;
  machineId?: string;
  port?: number;
};

const text = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

export function parseVmHandoffSearch(
  search: Record<string, unknown>,
): VmHandoffSearch {
  const raw =
    typeof search.port === "string" ? Number(search.port) : search.port;
  return {
    jamId: text(search.jam_id) ?? text(search.jamId),
    machineId: text(search.machine_id) ?? text(search.machineId),
    port:
      typeof raw === "number" &&
      Number.isInteger(raw) &&
      raw >= 1 &&
      raw <= 65535
        ? raw
        : undefined,
  };
}

export const servicePreviewPane = (machineId: string, port: number) =>
  `service-preview:${machineId}:${port}`;

export function handoffJamId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  return text((value as { jamId?: unknown }).jamId);
}
