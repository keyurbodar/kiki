export type EmptyOrgAtomHit = {
  line: number;
  column: number;
  match: string;
};

/**
 * An org id defaulted to `""` inside an atom read keys that read on an org that
 * has not resolved yet, so the read fires its request with an empty id —
 * `GET /orgs//folders/board`, a 404 on every shell mount. A failed Effect
 * request is not cheap: `Cause` combination dedupes reasons by hashing them, and
 * an `HttpClientError`'s error holds the failed `Request`, whose signal reaches
 * the global and the live router, so hashing it walks the whole route forest.
 *
 * The check is text-level and single-line, like `raw-values`: it catches the
 * shape that has gone wrong twice — `atom(orgId ?? "")` written inline — not an
 * empty id carried through a `const` first.
 */
const EMPTY_ORG = /[\w$.]*[Oo]rg[\w$]*[Ii]d\s*\?\?\s*""/g;

const ATOM_READ = /\b(?:useAtom\w*|[A-Za-z_$][\w$]*Atom)\(/;

export function findEmptyOrgAtomReads(source: string): EmptyOrgAtomHit[] {
  const hits: EmptyOrgAtomHit[] = [];
  source.split("\n").forEach((text, index) => {
    for (const match of text.matchAll(EMPTY_ORG)) {
      const at = match.index ?? 0;
      if (!ATOM_READ.test(text.slice(0, at + match[0].length))) continue;
      hits.push({ line: index + 1, column: at + 1, match: match[0] });
    }
  });
  return hits;
}

export const isGuarded = (path: string) =>
  /\.(ts|tsx)$/.test(path) &&
  !/\.test\.tsx?$/.test(path) &&
  path !== "src/routeTree.gen.ts";
