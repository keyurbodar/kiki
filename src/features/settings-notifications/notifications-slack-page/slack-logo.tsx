import slackLogoUrl from "./slack-logo.svg?url";

export type SlackLogoProps = { className?: string };

export function SlackLogo({ className }: SlackLogoProps) {
  return (
    <img
      src={slackLogoUrl}
      alt=""
      aria-hidden
      data-slot="icon"
      className={className ?? "size-(--icon-base) shrink-0"}
    />
  );
}
