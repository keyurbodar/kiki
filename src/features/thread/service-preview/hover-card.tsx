import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";

export type ServicePreviewHoverCardProps = {
  readonly trigger: React.ReactNode;
  readonly title: string;
  readonly port: string;
  readonly lifetime: string;
};

export function ServicePreviewHoverCard({
  trigger,
  title,
  port,
  lifetime,
}: ServicePreviewHoverCardProps) {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<span />}>{trigger}</PreviewCardTrigger>
      <PreviewCardContent className="w-72">
        <div className="flex flex-col">
          <span className="text-xs font-normal text-muted-foreground-2">
            Service preview
          </span>
          <span className="mt-1 text-sm font-medium text-foreground">
            {title}
          </span>
          <div className="mt-2.5 flex items-center gap-1.5 border-t-hairline border-border-1 pt-2.5">
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground-1">
              <img
                src={previewArt.detective}
                alt=""
                className="size-3 shrink-0 opacity-30"
              />
              Port {port}
            </span>
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground-2">{lifetime}</span>
          </div>
        </div>
      </PreviewCardContent>
    </PreviewCard>
  );
}
