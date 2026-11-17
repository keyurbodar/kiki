import {
  type AnnouncementDialogProps,
  AnnouncementHighlights,
  type AnnouncementVisualProps,
  CloudSimpleIcon,
  ImportIcon,
  MacbookIcon,
} from "@/components/release";
import { Button } from "@/primitives/button";
import { DialogTitle } from "@/primitives/dialog";
import { desktopAssetUrl } from "./assets";

export function DesktopAppVisual({ size, className }: AnnouncementVisualProps) {
  return (
    <img
      src={desktopAssetUrl(
        size === "hero" ? "desktop-app-hero.webp" : "desktop-app-thumb.webp",
      )}
      alt=""
      draggable={false}
      className={className}
    />
  );
}

const highlights = [
  {
    icon: MacbookIcon,
    lead: "Runs on your machine",
    body: "Point Capy at a local folder and it works on your files directly, with your own git and credentials",
  },
  {
    icon: CloudSimpleIcon,
    lead: "Seamless cloud handoff",
    body: "Hand a thread to a cloud machine and it keeps going after you close your laptop",
  },
  {
    icon: ImportIcon,
    lead: "Import your Claude Code and Codex threads",
    body: "Bring your local sessions into Capy and pick up where you left off",
  },
];

export function DesktopAppDialog({
  desktop,
  onClick,
  onDismiss,
}: AnnouncementDialogProps) {
  return (
    <div className="p-4">
      <DesktopAppVisual
        size="hero"
        className="aspect-[1600/1088] w-full rounded-(--radius-card) border-hairline border-border-2 shadow-card object-cover"
      />
      <DialogTitle className="self-start px-1 pt-4 text-left">
        {desktop ? "Welcome to Capy Desktop" : "Capy Desktop is available now!"}
      </DialogTitle>
      <AnnouncementHighlights items={highlights} />
      <div className="flex flex-col gap-2 px-1 pt-4">
        {desktop ? (
          <Button
            data-track-owner="shared/announcements/desktop-app.tsx#module:Button[Got it]"
            intent="accent"
            size="base"
            className="w-full"
            onClick={onClick}
          >
            Got it
          </Button>
        ) : (
          <Button
            data-track-owner="shared/announcements/desktop-app.tsx#module:DesktopDownloadButton[onClick=onClick]"
            intent="accent"
            size="base"
            className="w-full"
            render={
              <a
                href="https://capy.ai/download"
                target="_blank"
                rel="noreferrer"
              />
            }
            onClick={onClick}
          >
            Download the app
          </Button>
        )}
        <Button
          data-track-owner="shared/announcements/desktop-app.tsx#module:Button[onClick=onDismiss]"
          variant="ghost"
          size="base"
          className="w-full"
          onClick={onDismiss}
        >
          {desktop ? "Later" : "Not now"}
        </Button>
      </div>
    </div>
  );
}

export const desktopAppAnnouncement = {
  title: "Capy Desktop",
  visual: DesktopAppVisual,
  dialog: DesktopAppDialog,
};
