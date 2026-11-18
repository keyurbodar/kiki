/**
 * What a terminal would have left on screen from a captured command output.
 *
 * A tool result is raw bytes from a shell: colour and cursor escapes, a
 * progress bar that redraws itself with carriage returns, tabs. Capy reads them
 * in a terminal surface; we render a `<pre>`, where the same bytes are tofu and
 * a redrawn progress bar becomes one long line of every frame. Ported from
 * zeron's `clean` (apps/zgx/ui/ds/tool_detail.luau:191-283).
 */

const ESC = "\u001b";
const BELL = "\u0007";

/** A tab stop, as a terminal counts it. */
const TAB = 8;
/** Longest line kept, cut on a character boundary. */
const LINE_CHARS = 2000;
/** Past this, the output is a log, and a reader wants its tail. */
const KEEP_LINES = 400;

/** A C0 control a terminal would not print: everything but tab and newline. */
const isUnprintable = (code: number) =>
  (code < 0x20 && code !== 0x09) || code === 0x7f;

/**
 * Strip the escape sequences a terminal would consume: OSC titles (BEL or ST
 * terminated), CSI (colour, cursor, erase), charset selection, any other
 * two-byte escape, then a stray escape left over.
 */
export function stripEscapes(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const char = text[i] as string;
    if (char !== ESC) {
      out += char;
      i++;
      continue;
    }
    const next = text[i + 1];
    if (next === "[") {
      i += 2;
      while (i < text.length && !/[@-~]/.test(text[i] as string)) i++;
      i++;
      continue;
    }
    if (next === "]") {
      i += 2;
      while (i < text.length && text[i] !== BELL) {
        if (text[i] === ESC && text[i + 1] === "\\") {
          i++;
          break;
        }
        i++;
      }
      i++;
      continue;
    }
    if (next === "(" || next === ")" || next === "#") {
      i += 3;
      continue;
    }
    i += next === undefined ? 1 : 2;
  }
  return out;
}

/**
 * A line redrawn with carriage returns keeps only its last write, which is what
 * a reader saw at the end; tabs then expand to 8-column stops.
 */
function settleLine(line: string): string {
  const last =
    line
      .split("\r")
      .filter((part) => part !== "")
      .at(-1) ?? "";
  let out = "";
  for (const char of last) {
    if (char === "\t") {
      out += " ".repeat(TAB - (out.length % TAB));
      continue;
    }
    if (isUnprintable(char.codePointAt(0) ?? 0)) continue;
    out += char;
  }
  return out.length > LINE_CHARS ? `${out.slice(0, LINE_CHARS - 1)}…` : out;
}

export type CleanOutput = {
  /** The text a terminal would have left, ready for a `<pre>`. */
  text: string;
  /** Lines dropped from the front, so the surface can say so. */
  trimmed: number;
};

export function cleanOutput(raw: string): CleanOutput {
  const lines = stripEscapes(raw).split("\n").map(settleLine);

  let start = 0;
  while (start < lines.length && lines[start]?.trim() === "") start++;
  let end = lines.length;
  while (end > start && lines[end - 1]?.trim() === "") end--;

  const kept = lines.slice(start, end);
  const trimmed = Math.max(0, kept.length - KEEP_LINES);
  return { text: kept.slice(trimmed).join("\n"), trimmed };
}
