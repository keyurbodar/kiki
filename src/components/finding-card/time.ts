const units: ReadonlyArray<[limit: number, size: number, suffix: string]> = [
  [60, 1, "s"],
  [3600, 60, "m"],
  [86_400, 3600, "h"],
  [604_800, 86_400, "d"],
  [2_629_800, 604_800, "w"],
  [31_557_600, 2_629_800, "mo"],
  [Number.POSITIVE_INFINITY, 31_557_600, "y"],
];

export const relativeTime = (iso: string, now: number = Date.now()) => {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "";
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 45) return "just now";
  const [, size, suffix] = units.find(([limit]) => seconds < limit) ?? [
    0,
    31_557_600,
    "y",
  ];
  return `${Math.floor(seconds / size)}${suffix} ago`;
};
