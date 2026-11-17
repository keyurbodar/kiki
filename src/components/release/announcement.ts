import type { ComponentType } from "react";

export type AnnouncementVisualProps = {
  size?: "hero" | "card";
  animate?: boolean;
  className?: string;
};

export type AnnouncementDialogProps = {
  desktop: boolean;
  onClick: () => void;
  onDismiss: () => void;
};

export type AnnouncementDefinition = {
  title: string;
  meta?: string;
  summary?: string;
  visual?: ComponentType<AnnouncementVisualProps>;
  dialog: ComponentType<AnnouncementDialogProps>;
};
