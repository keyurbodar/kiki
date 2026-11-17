/** Capy's SKILL.md frontmatter helpers (drive authoring). */

export const skillPathPattern = /^skills\/([^/]+)\/SKILL\.md$/;

export const skillNamePattern = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const skillPath = (name: string) => `skills/${name}/SKILL.md`;

export const skillNameOf = (path: string) => skillPathPattern.exec(path)?.[1];

/** Turns typed text into a valid skill folder name. */
export const slugifySkillName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, 64);

/** Reads the frontmatter `description`; undefined when there is no frontmatter or it is blank. */
export const readSkillMeta = (text: string) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (match === null) return undefined;
  const values = new Map<string, string>();
  let last: string | undefined;
  for (const line of (match[1] ?? "").split(/\r?\n/)) {
    const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (field !== null) {
      last = field[1] ?? "";
      const value = (field[2] ?? "").trim();
      values.set(
        last,
        /^[>|][+-]?$/.test(value) ? "" : value.replace(/^(["'])(.*)\1$/, "$2"),
      );
    } else if (last !== undefined && /^\s+\S/.test(line)) {
      values.set(last, `${values.get(last) ?? ""} ${line.trim()}`.trim());
    }
  }
  const description = values.get("description");
  return {
    description: description === "" ? undefined : description,
    body: text.slice(match[0].length).replace(/^\s*\n/, ""),
  };
};

type FrontmatterEntry = { key: string | undefined; lines: string[] };

export type SkillDocument = {
  head: string;
  entries: FrontmatterEntry[];
  name: string;
  description: string;
  body: string;
};

const scalar = (lines: ReadonlyArray<string>) => {
  const first =
    /^[A-Za-z][\w-]*:\s*(.*)$/.exec(lines[0] ?? "")?.[1]?.trim() ?? "";
  const rest = lines.slice(1).map((line) => line.trim());
  if (/^[>|][+-]?\d?$/.test(first))
    return rest.join(first.startsWith("|") ? "\n" : " ").trim();
  const joined = [first, ...rest].filter((part) => part !== "").join(" ");
  const doubled = /^"((?:[^"\\]|\\.)*)"$/.exec(joined)?.[1];
  if (doubled !== undefined)
    return doubled.replace(/\\(.)/g, (_, char: string) =>
      char === "n" ? "\n" : char === "t" ? "\t" : char,
    );
  const single = /^'((?:[^']|'')*)'$/.exec(joined)?.[1];
  return single === undefined ? joined : single.replaceAll("''", "'");
};

const field = (key: string, value: string) =>
  value.includes("\n")
    ? [
        `${key}: |-`,
        ...value.split("\n").map((line) => (line === "" ? "" : `  ${line}`)),
      ].join("\n")
    : /^[A-Za-z(][^:#]*$/.test(value) &&
        !/\s$/.test(value) &&
        !/^(?:true|false|null|yes|no|on|off)$/i.test(value)
      ? `${key}: ${value}`
      : `${key}: ${JSON.stringify(value)}`;

/** Splits a SKILL.md into its frontmatter entries, name, description and body. */
export const parseSkill = (text: string): SkillDocument => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (match === null)
    return { head: "", entries: [], name: "", description: "", body: text };
  const entries = (match[1] ?? "")
    .split(/\r?\n/)
    .reduce<FrontmatterEntry[]>((all, line) => {
      const key = /^([A-Za-z][\w-]*):/.exec(line)?.[1];
      const previous = all.at(-1);
      if (
        key === undefined &&
        previous?.key !== undefined &&
        (line.trim() === "" || /^\s/.test(line))
      )
        previous.lines.push(line);
      else all.push({ key, lines: [line] });
      return all;
    }, []);
  const rest = text.slice(match[0].length);
  const gap = /^(?:[ \t]*\r?\n)*/.exec(rest)?.[0] ?? "";
  const read = (key: string) => {
    const entry = entries.find((candidate) => candidate.key === key);
    return entry === undefined ? "" : scalar(entry.lines);
  };
  return {
    head: match[0] + gap,
    entries,
    name: read("name"),
    description: read("description"),
    body: rest.slice(gap.length),
  };
};

/** Writes a SKILL.md back, changing only the fields that moved. */
export const writeSkill = (
  doc: SkillDocument,
  name: string,
  description: string,
  body: string,
) => {
  const renamed = name !== doc.name;
  const described = description !== doc.description;
  if (!renamed && !described) return doc.head + body;
  const line = (key: string, value: string) =>
    value === "" ? [] : [field(key, value)];
  const keys = new Set(doc.entries.map((entry) => entry.key));
  const lines = [
    ...(keys.has("name") || !renamed ? [] : line("name", name)),
    ...(keys.has("description") ? [] : line("description", description)),
    ...doc.entries.flatMap((entry) =>
      entry.key === "name" && renamed
        ? line("name", name)
        : entry.key === "description" && described
          ? line("description", description)
          : entry.lines,
    ),
  ];
  return lines.length === 0 ? body : `---\n${lines.join("\n")}\n---\n\n${body}`;
};
