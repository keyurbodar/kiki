export type GitHubConnection = {
  readonly state: "connected" | "auth_required" | "unavailable";
} | null;

export type GitHubWriteNoteProps = { connection: GitHubConnection | undefined };

export function GitHubWriteNote({ connection }: GitHubWriteNoteProps) {
  if (connection !== null) return null;
  return (
    <span className="text-xs text-muted-foreground-2">
      Posts as Capy ·{" "}
      <a
        data-track-owner="shared/pull-view/github-write.tsx#GitHubWriteNote:a[Connect GitHub]"
        href="/settings/integrations/github"
        target="_blank"
        rel="noreferrer"
        className="text-muted-foreground-2 underline underline-offset-2"
      >
        Connect GitHub
      </a>
    </span>
  );
}
