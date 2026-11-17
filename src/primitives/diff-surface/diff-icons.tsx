import type { SVGProps } from "react";

type DiffIconProps = SVGProps<SVGSVGElement>;

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

const strokeProps = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ChevronDownSmallIcon(props: DiffIconProps) {
  return (
    <svg aria-hidden="true" {...iconProps} {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...strokeProps}
      />
    </svg>
  );
}

export function ChevronRightSmallIcon(props: DiffIconProps) {
  return (
    <svg aria-hidden="true" {...iconProps} {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...strokeProps}
      />
    </svg>
  );
}

export function ArrowRightIcon(props: DiffIconProps) {
  return (
    <svg aria-hidden="true" {...iconProps} {...props}>
      <path d="M14 6L20 12L14 18" {...strokeProps} />
      <path d="M19 12H4" {...strokeProps} />
    </svg>
  );
}
