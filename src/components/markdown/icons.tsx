import type { ReactNode, SVGProps } from "react";

/*
 * Capy icons that the shared sprite in src/primitives/icon does not carry yet.
 * Path data is copied as-is from Capy's production bundle; fold these into the
 * sprite when the assets package regenerates it.
 */

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  label,
  className,
  children,
  ...props
}: GlyphProps & { label: string; children: ReactNode }) {
  return (
    <svg
      data-slot="icon"
      data-icon={label}
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={["size-(--icon-base) shrink-0", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </svg>
  );
}

const line = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const ExpandIcon = (props: GlyphProps) => (
  <Glyph label="expand-45" {...props}>
    <path d="M14 4H20V10" {...line} />
    <path d="M4 14V20H10" {...line} />
    <path d="M19.25 4.75L14 10" {...line} />
    <path d="M10 14L4.75 19.25" {...line} />
  </Glyph>
);

const dot = {
  fill: "currentColor",
  stroke: "currentColor",
  strokeWidth: "0.5",
};

export const WindowAppIcon = (props: GlyphProps) => (
  <Glyph label="window-app" {...props}>
    <path
      d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z"
      {...line}
    />
    <path d="M3 11H21" {...line} />
    <path
      d="M6 7.25C6.41421 7.25 6.75 7.58579 6.75 8C6.75 8.41421 6.41421 8.75 6 8.75C5.58579 8.75 5.25 8.41421 5.25 8C5.25 7.58579 5.58579 7.25 6 7.25Z"
      {...dot}
    />
    <path
      d="M9 7.25C9.41421 7.25 9.75 7.58579 9.75 8C9.75 8.41421 9.41421 8.75 9 8.75C8.58579 8.75 8.25 8.41421 8.25 8C8.25 7.58579 8.58579 7.25 9 7.25Z"
      {...dot}
    />
    <path
      d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8C12.75 8.41421 12.4142 8.75 12 8.75C11.5858 8.75 11.25 8.41421 11.25 8C11.25 7.58579 11.5858 7.25 12 7.25Z"
      {...dot}
    />
  </Glyph>
);

export const MinusSmallIcon = (props: GlyphProps) => (
  <Glyph label="minus-small" {...props}>
    <path
      d="M7 12H17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Glyph>
);

export const PlusLargeIcon = (props: GlyphProps) => (
  <Glyph label="plus-large" {...props}>
    <path
      d="M12 4V12M12 12V20M12 12H4M12 12H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Glyph>
);

export const RotateLeftIcon = (props: GlyphProps) => (
  <Glyph label="arrow-rotate-counter-clockwise" {...props}>
    <path
      d="M4.4834 14.6667C5.58163 17.7738 8.54493 20 12.0282 20C16.4465 20 20.0282 16.4183 20.0282 12C20.0282 7.58172 16.4465 4 12.0282 4C8.93224 4 6.99986 5.5 4.99986 8"
      {...line}
    />
    <path d="M5 4V8H9" {...line} />
  </Glyph>
);

export const ClipboardIcon = (props: GlyphProps) => (
  <Glyph label="clipboard" {...props}>
    <path
      d="M15 5H16C17.6569 5 19 6.34315 19 8V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V8C5 6.34315 6.34315 5 8 5H9M15 7V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V7H15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Glyph>
);

export const CheckmarkIcon = (props: GlyphProps) => (
  <Glyph label="checkmark-1" {...props}>
    <path d="M5 12.75L10 19L19 5" {...line} />
  </Glyph>
);

export const ArrowUpRightIcon = (props: GlyphProps) => (
  <Glyph label="arrow-up-right" {...props}>
    <path d="M18 15V6M18 6H9M18 6L6.25 17.75" {...line} />
  </Glyph>
);

export const PinIcon = (props: GlyphProps) => (
  <Glyph label="pin" {...props}>
    <path
      d="M4 20L8 16M5.02911 13.0291L10.9709 18.9709C12.7694 20.7694 15.8496 19.6542 16.0799 17.1212L16.354 14.1055C16.4452 13.103 17.0331 12.213 17.9194 11.7357L19.4499 10.9116C21.2192 9.95887 21.5699 7.56988 20.1489 6.14888L17.8511 3.85112C16.4301 2.43013 14.0411 2.78076 13.0884 4.55014L12.2643 6.08057C11.787 6.96692 10.897 7.55481 9.8945 7.64595L6.87882 7.92011C4.34575 8.15039 3.23057 11.2306 5.02911 13.0291Z"
      {...line}
    />
  </Glyph>
);

export const PinFilledIcon = (props: GlyphProps) => (
  <Glyph label="pin-filled" {...props}>
    <path
      d="M10.2638 19.6777L8 17.414L4.70711 20.7069C4.31658 21.0974 3.68342 21.0974 3.29289 20.7069C2.90237 20.3163 2.90237 19.6832 3.29289 19.2926L6.58579 15.9998L4.322 13.736C1.92396 11.3379 3.41086 7.231 6.78828 6.92396L9.80396 6.64981C10.4723 6.58905 11.0657 6.19712 11.3838 5.60623L12.2079 4.07579C13.4782 1.71661 16.6636 1.24911 18.5582 3.14376L20.856 5.44153C22.7506 7.33618 22.2831 10.5215 19.924 11.7918L18.3935 12.6159C17.8026 12.9341 17.4107 13.5274 17.3499 14.1958L17.0758 17.2115C16.7687 20.5889 12.6618 22.0758 10.2638 19.6777Z"
      fill="currentColor"
    />
  </Glyph>
);
