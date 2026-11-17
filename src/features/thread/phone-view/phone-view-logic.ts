export type PhoneDevice = {
  readonly machineId: string;
  readonly phone: {
    readonly model?: string | null;
    readonly os?: "ios" | "android";
    readonly stage?: string;
  };
  readonly state: string;
};

export function phoneDeviceSize(
  phone: PhoneDevice,
  folded = false,
): { width: number; height: number } {
  const base =
    phone.phone.model === "Pixel Fold" && folded
      ? { width: 344, height: 280 }
      : phone.phone.os === "ios"
        ? { width: 402, height: 874 }
        : { width: 412, height: 915 };
  return base.width > base.height
    ? { width: base.height, height: base.width }
    : base;
}

export function phoneNotice(phone: PhoneDevice): {
  title: string;
  lines: readonly string[];
} {
  if (phone.state === "creating" || phone.state === "waking") {
    return {
      title:
        phone.phone.stage === "waiting"
          ? "Waiting for a phone"
          : "Waking phone",
      lines: [],
    };
  }
  return {
    title: phone.state === "gone" ? "Phone shut down" : "Phone asleep",
    lines: phone.state === "gone" ? ["The session was lost"] : [],
  };
}
