import type { ReactNode } from "react";
import { fileCountLabel, formatBytes } from "@/components/directory-view";
import { Badge } from "@/primitives/badge";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  SettingsRowLink,
  type SettingsRowLinkProps,
} from "@/primitives/settings-row";
import { formatRelativeTime, useNow } from "./relative-time";

export type DriveSummary = {
  fileCount: number;
  totalBytes: number;
  headUpdatedAt: number | Date | null;
};

export type DriveDirectoryEntry = {
  key: string;
  to: SettingsRowLinkProps["to"];
  params?: SettingsRowLinkProps["params"];
  personal: boolean;
  label: ReactNode;
  scopeLabel: ReactNode;
  summary: DriveSummary;
};

export const driveSummaryLabel = (summary: DriveSummary) =>
  `${fileCountLabel(summary.fileCount)}, ${formatBytes(summary.totalBytes)}`;

export type DriveDirectoryProps = {
  entries: ReadonlyArray<DriveDirectoryEntry>;
  emptyLabel?: ReactNode;
};

export function DriveDirectory({
  entries,
  emptyLabel = "Nothing in Capy Drive yet",
}: DriveDirectoryProps) {
  const now = useNow();
  return (
    <Card rows>
      {entries.length === 0 ? (
        <div className="p-4 text-sm font-normal text-muted-foreground-2">
          {emptyLabel}
        </div>
      ) : (
        entries.map((entry) => (
          <SettingsRowLink
            key={entry.key}
            to={entry.to}
            params={entry.params}
            icon={<Icon name={entry.personal ? "user-settings" : "folder-1"} />}
            label={
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{entry.label}</span>
                <Badge size="sm">{entry.scopeLabel}</Badge>
              </span>
            }
            description={driveSummaryLabel(entry.summary)}
          >
            {entry.summary.headUpdatedAt === null ? null : (
              <span
                className="hidden text-xs font-normal whitespace-nowrap text-muted-foreground-2 sm:block"
                suppressHydrationWarning
              >
                Updated{" "}
                {formatRelativeTime(entry.summary.headUpdatedAt, { now })}
              </span>
            )}
          </SettingsRowLink>
        ))
      )}
    </Card>
  );
}
