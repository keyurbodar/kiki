/** A skill's entry file inside a drive scope. */
export const skillPathPattern = /^skills\/[^/]+\/SKILL\.md$/;

/** Valid skill folder names. */
export const skillNamePattern = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const instructionsPath = "AGENTS.md";

export const instructionsTemplate = `# Instructions

Instructions Capy follows in every thread in this scope.
`;

/** Lowercases and dashes a typed skill name the way Capy's field does. */
export const skillSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, 64);

export const skillFilePath = (name: string) => `skills/${name}/SKILL.md`;

export const skillTemplate = (name: string, description: string) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nWhen to use this skill and the steps Capy follows.\n`;

/** The skill folder name of a SKILL.md path. */
export const skillNameOf = (path: string) =>
  skillPathPattern.test(path) ? path.split("/")[1] : undefined;

/** A SKILL.md's frontmatter description and the body after it. */
export function parseSkillDocument(text: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (match === null) return undefined;
  const fields = new Map<string, string>();
  let key: string | undefined;
  for (const line of (match[1] ?? "").split(/\r?\n/)) {
    const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (field !== null) {
      key = field[1] ?? "";
      const raw = (field[2] ?? "").trim();
      fields.set(
        key,
        /^[>|][+-]?$/.test(raw) ? "" : raw.replace(/^(["'])(.*)\1$/, "$2"),
      );
    } else if (key !== undefined && /^\s+\S/.test(line)) {
      fields.set(key, `${fields.get(key) ?? ""} ${line.trim()}`.trim());
    }
  }
  const description = fields.get("description");
  return {
    description: description === "" ? undefined : description,
    body: text.slice(match[0].length).replace(/^\s*\n/, ""),
  };
}

/** Joins a folder and a relative path inside a drive scope. */
export const joinDrivePath = (directory: string, path: string) =>
  directory === "" ? path : `${directory}/${path}`;

/** Existing paths a new path would collide with, as file or as folder. */
export const pathCollisions = (existing: Iterable<string>, path: string) =>
  [...existing].filter(
    (candidate) =>
      candidate === path ||
      candidate.startsWith(`${path}/`) ||
      path.startsWith(`${candidate}/`),
  );

const validSegment = (segment: string) =>
  segment !== "" && segment !== "." && segment !== "..";

/** The new-file dialog's target path, collision and validity for a typed name. */
export function newFilePath(
  directory: string,
  existing: Iterable<string>,
  input: string,
) {
  const name = input.trim().replace(/^\/+/, "");
  const path = joinDrivePath(directory, name);
  const collides = name !== "" && pathCollisions(existing, path).length > 0;
  return {
    path,
    collides,
    valid: name !== "" && !collides && name.split("/").every(validSegment),
  };
}
