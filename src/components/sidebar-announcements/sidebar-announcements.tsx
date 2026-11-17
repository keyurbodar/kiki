import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ComponentProps, useEffect, useState } from "react";
import {
  type AnnouncementDefinition,
  desktopAppAnnouncement,
  RELEASES,
  releaseAnnouncement,
} from "@/components/release";
import { currentUserAtom } from "@/data/atoms/session";
import { Dialog } from "@/primitives/dialog";
import { AnnouncementCard, ReleasePlainCard } from "./announcement-cards";
import { announcementsFor } from "./announcements";
import {
  announcementReactivityKey,
  announcementsAtom,
  recordAnnouncementAtom,
} from "./atoms";

const definitions: Record<string, AnnouncementDefinition> = {
  "desktop-app-2026-09": desktopAppAnnouncement,
  ...Object.fromEntries(
    RELEASES.map((release) => [
      `release-${release.version}`,
      releaseAnnouncement(release),
    ]),
  ),
};

export type SidebarAnnouncementsProps = ComponentProps<"div">;

export function SidebarAnnouncements({
  className,
  ...props
}: SidebarAnnouncementsProps) {
  const user = useAtomValue(currentUserAtom);
  const userId = AsyncResult.isSuccess(user) ? user.value.id : undefined;
  const announcements = useAtomValue(announcementsAtom(userId ?? ""));
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState<string | null>(null);
  const record = useAtomSet(recordAnnouncementAtom, { mode: "promise" });
  const platforms =
    typeof window !== "undefined" && "capyDesktop" in window
      ? ["web", "desktop"]
      : ["web"];

  const announcement =
    userId === undefined || !AsyncResult.isSuccess(announcements)
      ? undefined
      : announcementsFor(
          announcements.value,
          definitions,
          hidden,
          platforms,
        )[0];
  const key = announcement?.key;

  useEffect(() => {
    if (key === undefined || userId === undefined) return;
    record({
      params: { key },
      payload: { action: "seen" },
      reactivityKeys: [announcementReactivityKey(userId)],
    }).catch(() => {});
  }, [key, record, userId]);

  if (announcement === undefined) return null;

  const dismiss = () => {
    setOpen(null);
    setHidden((previous) => new Set(previous).add(announcement.key));
    if (userId === undefined) return;
    record({
      params: { key: announcement.key },
      payload: { action: "dismissed" },
      reactivityKeys: [announcementReactivityKey(userId)],
    }).catch(() => {});
  };

  const click = () => {
    if (userId !== undefined)
      record({
        params: { key: announcement.key },
        payload: { action: "clicked" },
      }).catch(() => {});
    dismiss();
  };

  const DialogBody = announcement.dialog;

  return (
    <div
      className={["shrink-0 px-2 pb-2", className].filter(Boolean).join(" ")}
      {...props}
    >
      {announcement.visual === undefined ? (
        <ReleasePlainCard
          title={announcement.title}
          meta={announcement.meta ?? ""}
          summary={announcement.summary}
          onOpen={() => setOpen(announcement.key)}
          onDismiss={dismiss}
        />
      ) : (
        <AnnouncementCard
          title={announcement.title}
          meta={announcement.meta ?? ""}
          visual={announcement.visual}
          onOpen={() => setOpen(announcement.key)}
          onDismiss={dismiss}
        />
      )}
      <Dialog
        open={open !== null}
        onOpenChange={(next) => setOpen(next ? announcement.key : null)}
      >
        <DialogBody
          desktop={platforms.length > 1}
          onClick={click}
          onDismiss={dismiss}
        />
      </Dialog>
    </div>
  );
}
