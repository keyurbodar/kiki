export type PullLabel = {
  name: string;
  color: string | null;
  description?: string | null;
  id?: string;
};

export const sameLabel = (a: PullLabel, b: PullLabel) => a.name === b.name;

export const sortLabels = (labels: ReadonlyArray<PullLabel>) =>
  labels.toSorted((a, b) => a.name.localeCompare(b.name));

/** A stable key for a set of applied labels, to drop stale optimistic state. */
export const labelsKey = (labels: ReadonlyArray<PullLabel>) =>
  labels.map((label) => label.name).join("\n");

/** Every label the menu lists: the repo's options plus any applied ones. */
export const labelMenuItems = (
  options: ReadonlyArray<PullLabel> | null,
  applied: ReadonlyArray<PullLabel>,
) => {
  const byName = new Map((options ?? []).map((label) => [label.name, label]));
  for (const label of applied) {
    if (!byName.has(label.name)) byName.set(label.name, label);
  }
  return sortLabels([...byName.values()]);
};

export const labelMatches = (label: PullLabel, query: string) => {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return [label.name, label.description ?? ""].some((text) =>
    text.toLowerCase().includes(needle),
  );
};

/** The one label a multi-select change adds or removes, or null. */
export const labelToggle = (
  next: ReadonlyArray<PullLabel>,
  selected: ReadonlyArray<PullLabel>,
): { name: string; applied: boolean } | null => {
  const added = next.find(
    (label) => !selected.some((s) => sameLabel(s, label)),
  );
  if (added !== undefined) return { name: added.name, applied: true };
  const removed = selected.find(
    (label) => !next.some((n) => sameLabel(n, label)),
  );
  return removed === undefined ? null : { name: removed.name, applied: false };
};

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const toLabel = (value: unknown): PullLabel | null => {
  const raw = record(value);
  if (typeof raw.name !== "string") return null;
  return {
    name: raw.name,
    color: typeof raw.color === "string" ? raw.color.replace(/^#/, "") : null,
    description: typeof raw.description === "string" ? raw.description : null,
    id: typeof raw.id === "string" ? raw.id : undefined,
  };
};

/** Reads labels from a response that is a list or carries `labels`. */
export const readLabels = (value: unknown): ReadonlyArray<PullLabel> => {
  const list = Array.isArray(value) ? value : record(value).labels;
  return Array.isArray(list)
    ? list.flatMap((item) => {
        const label = toLabel(item);
        return label === null ? [] : [label];
      })
    : [];
};

/** A GitHub label colour as a CSS colour, when it is a 6-digit hex. */
export const labelColor = (color: string | null) =>
  color !== null && /^[0-9a-f]{6}$/i.test(color) ? `#${color}` : undefined;
