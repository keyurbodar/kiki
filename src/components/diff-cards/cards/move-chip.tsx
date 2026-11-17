import { Icon } from "@/primitives/icon";

export type DiffMoveSide = "origin" | "destination";

export type DiffMove = {
  fromPath: string;
  fromLine: number;
  toPath: string;
  toLine: number;
  lineCount: number;
};

export type DiffJumpTarget = {
  path: string;
  line: number;
  side: "additions" | "deletions";
};

export const moveJumpTarget = (
  move: DiffMove,
  at: DiffMoveSide,
): DiffJumpTarget =>
  at === "origin"
    ? { path: move.toPath, line: move.toLine, side: "additions" }
    : { path: move.fromPath, line: move.fromLine, side: "deletions" };

export const moveChipLabel = (move: DiffMove, at: DiffMoveSide) => {
  const target = moveJumpTarget(move, at);
  const where =
    move.fromPath === move.toPath ? `line ${target.line}` : target.path;
  return at === "origin" ? `Moved to ${where}` : `Moved from ${where}`;
};

export type MoveChipProps = {
  metadata: { move: DiffMove; at: DiffMoveSide };
  onJump: (path: string, line: number, side: DiffJumpTarget["side"]) => void;
  lineJumps?: boolean;
};

export function MoveChip({ metadata, onJump, lineJumps }: MoveChipProps) {
  const { move, at } = metadata;
  const content = (
    <>
      <Icon name="arrow-up-right" className="diff-move-chip-icon" />
      <span className="diff-move-chip-label">{moveChipLabel(move, at)}</span>
      <span className="diff-move-chip-count">· {move.lineCount} lines</span>
    </>
  );
  return (
    <div className="diff-move-chip">
      {move.fromPath === move.toPath && !lineJumps ? (
        <span className="diff-move-chip-target">{content}</span>
      ) : (
        <button
          type="button"
          className="diff-move-chip-target"
          onClick={() => {
            const target = moveJumpTarget(move, at);
            onJump(target.path, target.line, target.side);
          }}
        >
          {content}
        </button>
      )}
    </div>
  );
}
