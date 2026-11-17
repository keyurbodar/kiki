const ASSIGNMENT = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
const ESCAPES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  '"': '"',
  "\\": "\\",
};
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const MAX_VALUE_BYTES = 32768;
export const MAX_DESCRIPTION_BYTES = 4096;
export const NAME_RULE =
  "Names are shell identifiers of at most 191 characters";

export const isVariableName = (name: string) =>
  NAME.test(name) && name.length <= 191;

export const byteLength = (value: string) =>
  new TextEncoder().encode(value).length;

export const isQuoted = (value: string) =>
  value.length >= 2 &&
  ((value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")));

export type ParsedVariable = { name: string; value: string };

export const parseEnv = (
  text: string,
): { entries: ParsedVariable[]; complete: boolean } | null => {
  const entries: ParsedVariable[] = [];
  const lines = text.split(/\r?\n/);
  let complete = true;
  let index = 0;
  while (index < lines.length) {
    const line = (lines[index] ?? "").trim();
    index += 1;
    if (line === "" || line.startsWith("#")) continue;
    const match = ASSIGNMENT.exec(line);
    if (match === null) {
      complete = false;
      continue;
    }
    const name = match[1] ?? "";
    const raw = match[2] ?? "";
    const quote =
      raw.startsWith('"') || raw.startsWith("'") ? raw[0] : undefined;
    if (quote === undefined) {
      entries.push({ name, value: raw.trim() });
      continue;
    }
    const closing = (source: string, from: number) => {
      for (let at = from; at < source.length; at += 1) {
        if (quote === '"' && source[at] === "\\") at += 1;
        else if (source[at] === quote) return at;
      }
      return -1;
    };
    const parts = [raw.slice(1)];
    const start = index;
    let end = closing(raw, 1);
    let interrupted = false;
    while (end === -1 && index < lines.length) {
      const next = lines[index] ?? "";
      const assignment = ASSIGNMENT.exec(next.trim());
      if (assignment !== null && /[^=]/.test(assignment[2] ?? "")) {
        interrupted = true;
        break;
      }
      index += 1;
      parts.push(next);
      end = closing(next, 0);
      if (end !== -1) parts[parts.length - 1] = next.slice(0, end);
    }
    if (end === -1) {
      index = start;
      if (interrupted) complete = false;
      entries.push({ name, value: raw.trim() });
      continue;
    }
    if (parts.length === 1) parts[0] = raw.slice(1, end);
    const value = parts.join("\n");
    entries.push({
      name,
      value:
        quote === '"'
          ? value.replace(
              /\\(.)/gs,
              (escaped, char: string) => ESCAPES[char] ?? escaped,
            )
          : value,
    });
  }
  return entries.length === 0 ? null : { entries, complete };
};
