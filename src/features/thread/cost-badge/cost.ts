export const CREDITS_PER_DOLLAR = 1000;

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCredits = (credits: number) =>
  dollars.format(credits / CREDITS_PER_DOLLAR);

export const isVisibleCredits = (credits: number) =>
  formatCredits(credits) !== formatCredits(0);

export type ModelUsage = {
  entryId: string;
  label: string;
  unbilled: boolean;
  credentialName: string | null;
  credits: number;
  tokenFeeCredits: number;
};

export type ImageUsage = {
  endpoint: string;
  label: string;
  credits: number;
};

export type UsageMember = {
  jamId: string;
  familyId: string;
  usage: { totalCredits: number; vmCredits: number };
  keyCredits: number;
  models: ReadonlyArray<ModelUsage>;
  images: ReadonlyArray<ImageUsage>;
};

export type CrewThread = { jamId: string; title: string | null };

export type ThreadUsage = {
  members: ReadonlyArray<UsageMember>;
  crew: ReadonlyArray<CrewThread>;
};

export type SubtreeNode = {
  id: string;
  localIndex: string | number | null;
  parentJamId: string | null;
};

export type CostRow = {
  key: string;
  label: string;
  members: ReadonlyArray<UsageMember>;
  charged: number;
  onKeys: number;
};

export const costRow = (
  key: string,
  label: string,
  members: ReadonlyArray<UsageMember>,
): CostRow => ({
  key,
  label,
  members,
  charged: members.reduce((sum, m) => sum + m.usage.totalCredits, 0),
  onKeys: members.reduce((sum, m) => sum + m.keyCredits, 0),
});

const groupBy = <T, K>(items: ReadonlyArray<T>, key: (item: T) => K) => {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group === undefined) groups.set(k, [item]);
    else group.push(item);
  }
  return groups;
};

export const subagentPath = (
  subtree: ReadonlyArray<SubtreeNode>,
  rootId: string,
  id: string,
): string | null => {
  const path: Array<string | number> = [];
  let node = subtree.find((n) => n.id === id);
  while (node !== undefined && path.length < 8) {
    if (node.localIndex === null) return null;
    path.unshift(node.localIndex);
    if (node.parentJamId === rootId) return path.join(".");
    const parent = node.parentJamId;
    node = subtree.find((n) => n.id === parent);
  }
  return null;
};

const byTotalDesc = (a: CostRow, b: CostRow) =>
  b.charged + b.onKeys - (a.charged + a.onKeys);

export function buildCostRows(
  threadId: string,
  usage: ThreadUsage,
  subtree: ReadonlyArray<SubtreeNode>,
): CostRow[] {
  const byJam = new Map(usage.members.map((m) => [m.jamId, m]));
  if (usage.crew.length > 0) {
    const families = groupBy(usage.members, (m) => m.familyId);
    const own = families.get(threadId) ?? [];
    const crew = usage.crew
      .flatMap((c) => {
        const members = families.get(c.jamId) ?? [];
        return members.length === 0
          ? []
          : [costRow(c.jamId, c.title ?? "Untitled thread", members)];
      })
      .sort(byTotalDesc);
    return [
      ...(own.length === 0 ? [] : [costRow(threadId, "This thread", own)]),
      ...crew,
    ];
  }
  const children = subtree
    .flatMap((node) => {
      const member = byJam.get(node.id);
      if (member === undefined) return [];
      const path = subagentPath(subtree, threadId, node.id);
      return [
        {
          row: costRow(
            node.id,
            path === null ? "Side thread" : `Subagent ${path}`,
            [member],
          ),
          segments: path === null ? [Infinity] : path.split(".").map(Number),
        },
      ];
    })
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.segments.length, b.segments.length); i++) {
        const diff = (a.segments[i] ?? 0) - (b.segments[i] ?? 0);
        if (diff !== 0) return diff;
      }
      return 0;
    })
    .map((c) => c.row);
  const self = byJam.get(threadId);
  const seen = new Set([threadId, ...children.map((c) => c.key)]);
  const other = usage.members.filter((m) => !seen.has(m.jamId));
  return [
    ...(self === undefined ? [] : [costRow(threadId, "This thread", [self])]),
    ...children,
    ...(other.length === 0 ? [] : [costRow("other", "Other", other)]),
  ];
}

export const SEED_HUES = [255, 30, 150, 320, 75, 205, 355, 115, 285, 175];

export function costHues(count: number): number[] {
  const hues = [...SEED_HUES];
  while (hues.length < count) {
    const sorted = [...hues].sort((a, b) => a - b);
    const widest = sorted
      .map((hue, i) => ({
        hue,
        gap: (sorted[i + 1] ?? (sorted[0] ?? 0) + 360) - hue,
      }))
      .reduce((best, next) => (next.gap > best.gap ? next : best));
    hues.push((widest.hue + widest.gap / 2) % 360);
  }
  return hues;
}

export function rowHues(rows: ReadonlyArray<CostRow>): Map<string, number> {
  const hues = costHues(rows.length);
  return new Map(
    [...rows]
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
      .map((row, i) => [row.key, hues[i] ?? 0] as const),
  );
}

export type ModelLine = {
  key: string;
  label: string;
  credentialName: string | null;
  unbilled: boolean;
  credits: number;
  tokenFee: number;
};

export type ImageLine = { endpoint: string; label: string; credits: number };

export type ResourceLines = {
  machines: number;
  tokenFee: number;
  billed: ModelLine[];
  images: ImageLine[];
  unbilled: ModelLine[];
};

const modelKey = (m: ModelUsage) =>
  `${m.entryId}:${m.unbilled}:${m.credentialName ?? ""}`;

export function resourceLines(
  members: ReadonlyArray<UsageMember>,
): ResourceLines {
  const models = [
    ...groupBy(
      members.flatMap((m) => m.models),
      modelKey,
    ).values(),
  ].map(
    (group): ModelLine => ({
      key: modelKey(group[0] as ModelUsage),
      credentialName: (group[0] as ModelUsage).credentialName,
      label: (group[0] as ModelUsage).label,
      unbilled: (group[0] as ModelUsage).unbilled,
      credits: group.reduce((sum, m) => sum + m.credits, 0),
      tokenFee: group.reduce((sum, m) => sum + m.tokenFeeCredits, 0),
    }),
  );
  const images = [
    ...groupBy(
      members.flatMap((m) => m.images),
      (i) => i.endpoint,
    ).values(),
  ].map(
    (group): ImageLine => ({
      endpoint: (group[0] as ImageUsage).endpoint,
      label: (group[0] as ImageUsage).label,
      credits: group.reduce((sum, i) => sum + i.credits, 0),
    }),
  );
  const byCreditsDesc = (a: ModelLine, b: ModelLine) => b.credits - a.credits;
  return {
    machines: members.reduce((sum, m) => sum + m.usage.vmCredits, 0),
    tokenFee: models.reduce((sum, m) => sum + m.tokenFee, 0),
    billed: models
      .filter((m) => !m.unbilled && isVisibleCredits(m.credits))
      .sort(byCreditsDesc),
    images: images.filter((i) => isVisibleCredits(i.credits)),
    unbilled: models
      .filter((m) => m.unbilled && isVisibleCredits(m.credits))
      .sort(byCreditsDesc),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const num = (value: unknown) => (typeof value === "number" ? value : 0);

export function parseThreadUsage(value: unknown): ThreadUsage | null {
  if (!isRecord(value) || !Array.isArray(value.members)) return null;
  const members = value.members.flatMap((m): UsageMember[] => {
    if (!isRecord(m) || typeof m.jamId !== "string") return [];
    const usage = isRecord(m.usage) ? m.usage : {};
    return [
      {
        jamId: m.jamId,
        familyId: typeof m.familyId === "string" ? m.familyId : m.jamId,
        usage: {
          totalCredits: num(usage.totalCredits),
          vmCredits: num(usage.vmCredits),
        },
        keyCredits: num(m.keyCredits),
        models: Array.isArray(m.models)
          ? m.models.filter(isRecord).map((x) => ({
              entryId: String(x.entryId ?? ""),
              label: String(x.label ?? ""),
              unbilled: x.unbilled === true,
              credentialName:
                typeof x.credentialName === "string" ? x.credentialName : null,
              credits: num(x.credits),
              tokenFeeCredits: num(x.tokenFeeCredits),
            }))
          : [],
        images: Array.isArray(m.images)
          ? m.images.filter(isRecord).map((x) => ({
              endpoint: String(x.endpoint ?? ""),
              label: String(x.label ?? ""),
              credits: num(x.credits),
            }))
          : [],
      },
    ];
  });
  const crew = Array.isArray(value.crew)
    ? value.crew.flatMap((c): CrewThread[] =>
        isRecord(c) && typeof c.jamId === "string"
          ? [
              {
                jamId: c.jamId,
                title: typeof c.title === "string" ? c.title : null,
              },
            ]
          : [],
      )
    : [];
  return { members, crew };
}
