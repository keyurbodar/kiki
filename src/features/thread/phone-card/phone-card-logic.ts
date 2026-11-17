export type PhoneRow = {
  readonly machineId: string;
  readonly model?: string | null;
  readonly os?: "ios" | "android";
  readonly osVersion?: string | null;
  readonly state?: string;
};

export function phoneLabel(phone: PhoneRow): string {
  return phone.model ?? (phone.os === "ios" ? "iPhone" : "Android phone");
}

export function phoneSubtitle(phone: PhoneRow): string {
  const os = phone.os === "ios" ? "iOS" : "Android";
  return phone.osVersion == null
    ? os
    : `${os} ${phone.osVersion.replace(/(?:\.0)+$/, "")}`;
}

export function phoneStatus(phone: PhoneRow): string {
  if (phone.state === "awake") return "Awake";
  if (phone.state === "gone") return "Shut down";
  if (phone.state === "creating" || phone.state === "waking")
    return "Waking phone";
  return "Asleep";
}
