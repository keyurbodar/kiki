import linearUrl from "./brand/linear.svg?url";
import paperUrl from "./brand/paper.svg?url";
import revylUrl from "./brand/revyl.svg?url";
import slackUrl from "./brand/slack.svg?url";

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.58 2.35 1.13 2.92.87.09-.67.35-1.13.63-1.39-2.22-.26-4.55-1.14-4.55-5.09 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.33 9.33 0 0 1 12 6.84c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.96-2.34 4.82-4.57 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function TailscaleIcon() {
  return (
    <svg
      viewBox="-4 -4 36 36"
      aria-hidden="true"
      className="size-(--icon-base) opacity-100"
    >
      <g fill="currentColor">
        <circle cx="3.5" cy="14" r="3.5" />
        <circle cx="14" cy="14" r="3.5" />
        <circle cx="24.5" cy="14" r="3.5" />
        <circle cx="14" cy="24.5" r="3.5" />
        <g opacity="0.4">
          <circle cx="3.5" cy="3.5" r="3.5" />
          <circle cx="14" cy="3.5" r="3.5" />
          <circle cx="24.5" cy="3.5" r="3.5" />
          <circle cx="3.5" cy="24.5" r="3.5" />
          <circle cx="24.5" cy="24.5" r="3.5" />
        </g>
      </g>
    </svg>
  );
}

function BrandImage({ src }: { src: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-(--icon-base) opacity-100"
    >
      <image href={src} width="24" height="24" />
    </svg>
  );
}

export const SlackIcon = () => <BrandImage src={slackUrl} />;
export const LinearIcon = () => <BrandImage src={linearUrl} />;
export const PaperIcon = () => <BrandImage src={paperUrl} />;
export const RevylIcon = () => <BrandImage src={revylUrl} />;

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
