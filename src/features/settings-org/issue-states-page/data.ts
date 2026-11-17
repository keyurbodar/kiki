type Row = Record<string, unknown>;

export type IssueState = {
  readonly id: string;
  readonly name: string;
  readonly type: "open" | "closed";
  readonly icon: string;
  readonly color: string;
  readonly position: number;
  readonly isDefault: boolean;
};

export type IssueLabel = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
};

export type StateCounts = Record<string, number>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

export const decodeStates = (value: unknown): ReadonlyArray<IssueState> => {
  const source = row(value);
  return list(Array.isArray(value) ? value : source.states).map((entry) => {
    const item = row(entry);
    return {
      id: str(item.id),
      name: str(item.name),
      type: item.type === "closed" ? "closed" : "open",
      icon: str(item.icon, "empty"),
      color: str(item.color, "gray"),
      position: num(item.position),
      isDefault: item.isDefault === true,
    };
  });
};

export const decodeLabels = (value: unknown): ReadonlyArray<IssueLabel> => {
  const source = row(value);
  return list(Array.isArray(value) ? value : source.labels).map((entry) => {
    const item = row(entry);
    return {
      id: str(item.id),
      name: str(item.name),
      color: str(item.color, "gray"),
    };
  });
};

export const decodeCounts = (value: unknown): StateCounts => {
  const source = row(value);
  const counts: StateCounts = {};
  for (const [id, count] of Object.entries(
    row(source.counts ?? (Array.isArray(value) ? {} : value)),
  )) {
    counts[id] = num(count);
  }
  return counts;
};

export const issueLabel = (name: string, color: string) => ({ name, color });

export const issueStateChange = (
  state: IssueState,
  next: Partial<IssueState>,
) => {
  const payload: Record<string, string | undefined> = {};
  if (next.name !== undefined && next.name !== state.name)
    payload.name = next.name;
  if (next.type !== undefined && next.type !== state.type)
    payload.type = next.type;
  if (next.icon !== undefined && next.icon !== state.icon)
    payload.icon = next.icon;
  if (next.color !== undefined && next.color !== state.color)
    payload.color = next.color;
  return payload;
};
