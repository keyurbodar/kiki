import type { MarkerComment } from "@/components/comment-marker/marker";
import {
  compareFindings,
  findingAnchor,
  type PullFinding,
} from "@/components/finding-card/finding";
import { anchorKey } from "./rows";

export type FileDiscussions = {
  lines: Map<string, MarkerComment[]>;
  file: MarkerComment[];
};

export const toMarker = (finding: PullFinding): MarkerComment => ({
  id: finding.id,
  finding: {
    kind: finding.kind,
    severity: finding.severity,
    confidence: finding.confidence,
    summary: finding.summary,
  },
});

export const groupFindings = (
  findings: ReadonlyArray<PullFinding>,
  head: string | undefined,
): Map<string, FileDiscussions> => {
  const byFile = new Map<string, FileDiscussions>();
  for (const finding of [...findings].sort(compareFindings)) {
    const anchor = findingAnchor(finding, head);
    if (anchor.file === null) continue;
    const entry: FileDiscussions = byFile.get(anchor.file) ?? {
      lines: new Map(),
      file: [],
    };
    if (anchor.line === null) entry.file.push(toMarker(finding));
    else {
      const key = anchorKey(anchor.side, anchor.line);
      entry.lines.set(key, [
        ...(entry.lines.get(key) ?? []),
        toMarker(finding),
      ]);
    }
    byFile.set(anchor.file, entry);
  }
  return byFile;
};

export const findingsOnUnchangedFiles = (
  findings: ReadonlyArray<PullFinding>,
  paths: ReadonlySet<string>,
) =>
  findings.filter((finding) => {
    const file = finding.githubAnchor?.file ?? finding.file;
    return file !== null && !paths.has(file);
  });
