import type { SVGProps } from "react";

export type SettingsAgentIconProps = SVGProps<SVGSVGElement>;

function StrokeIcon({
  paths,
  ...props
}: SettingsAgentIconProps & { paths: readonly string[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      {...props}
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const chevronDownSmall = [
  "M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10",
];

export function ChevronDownSmallIcon(props: SettingsAgentIconProps) {
  return (
    <StrokeIcon
      data-icon="chevron-down-small"
      paths={chevronDownSmall}
      {...props}
    />
  );
}

const dotGrid = [
  "M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z",
  "M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z",
  "M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z",
];

export function DotGridHorizontalIcon(props: SettingsAgentIconProps) {
  return (
    <StrokeIcon
      data-icon="dot-grid-1x3-horizontal"
      paths={dotGrid}
      {...props}
    />
  );
}

const plus = ["M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5"];

export function PlusSmallIcon(props: SettingsAgentIconProps) {
  return <StrokeIcon data-icon="plus-small" paths={plus} {...props} />;
}

const editSmall = [
  "M11 4H8.8C7.11984 4 6.27976 4 5.63803 4.32698C5.07354 4.6146 4.6146 5.07354 4.32698 5.63803C4 6.27976 4 7.11984 4 8.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2V13",
  "M13 11V7.99998L17.5 3.49998C18.3284 2.67156 19.6716 2.67156 20.5 3.49998C21.3284 4.32841 21.3284 5.67155 20.5 6.49998L16 11H13Z",
];

export function EditSmallIcon(props: SettingsAgentIconProps) {
  return <StrokeIcon data-icon="edit-small-1" paths={editSmall} {...props} />;
}

const rotateLeft = [
  "M4.4834 14.6667C5.58163 17.7738 8.54493 20 12.0282 20C16.4465 20 20.0282 16.4183 20.0282 12C20.0282 7.58172 16.4465 4 12.0282 4C8.93224 4 6.99986 5.5 4.99986 8",
  "M5 4V8H9",
];

export function ArrowRotateCounterClockwiseIcon(props: SettingsAgentIconProps) {
  return (
    <StrokeIcon
      data-icon="arrow-rotate-counter-clockwise"
      paths={rotateLeft}
      {...props}
    />
  );
}

const checkmark = ["M5 12.75L10 19L19 5"];

export function CheckmarkIcon(props: SettingsAgentIconProps) {
  return <StrokeIcon data-icon="checkmark-1" paths={checkmark} {...props} />;
}
