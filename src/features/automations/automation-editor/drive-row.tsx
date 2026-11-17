import { formatBytes } from "@/components/directory-view/format-bytes";
import {
  useDriveListing,
  useDriveSession,
} from "@/features/drive/drive-detail-page";
import { Badge } from "@/primitives/badge";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { SettingsRowLink } from "@/primitives/settings-row";
import { SectionHeader } from "./parts";

/** `Capy Drive` on `/automation/:id`: the automation's drive, with its file count. */
export function AutomationDriveRow({
  automationId,
  title,
}: {
  automationId: string;
  title: string;
}) {
  const session = useDriveSession();
  const { listing } = useDriveListing(session.orgId, { automationId });
  const entries = listing?.entries ?? [];
  const bytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Capy Drive"
        subtitle="Durable files available to every run"
      />
      <Card className="-mx-4">
        <SettingsRowLink
          to="/automation/$automationId/drive"
          params={{ automationId }}
          label={
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{title}</span>
              <Badge size="sm">Automation</Badge>
            </span>
          }
          description={`${entries.length} files, ${formatBytes(bytes)}`}
          icon={<Icon name="folder-1" />}
        />
      </Card>
    </section>
  );
}
