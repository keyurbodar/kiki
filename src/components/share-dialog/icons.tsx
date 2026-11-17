import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export type ShareDialogIconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const round = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const square = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square",
} as const;

function Glyph({
  className,
  children,
  ...props
}: ShareDialogIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-(--icon-sm) shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function LockIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z"
        {...round}
      />
      <path
        d="M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5"
        {...round}
      />
      <path d="M12 14V17" {...round} />
    </Glyph>
  );
}

export function GlobeIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        {...square}
      />
      <path
        d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z"
        {...square}
      />
      <path d="M21 12H3" {...square} />
    </Glyph>
  );
}

export function CheckIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.75L10 19L19 5" {...round} />
    </Glyph>
  );
}

export function ChevronDownSmallIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...round}
      />
    </Glyph>
  );
}

export function ChevronRightSmallIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...round}
      />
    </Glyph>
  );
}

export function ChevronLeftSmallIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
        {...round}
      />
    </Glyph>
  );
}

export function DotsHorizontalIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        {...round}
      />
      <path
        d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z"
        {...round}
      />
      <path
        d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z"
        {...round}
      />
    </Glyph>
  );
}

export function LinkIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11"
        {...round}
      />
      <path
        d="M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995"
        {...round}
      />
      <path d="M9 15L15 9" {...round} />
    </Glyph>
  );
}

export function CrossIcon(props: ShareDialogIconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" {...round} />
    </Glyph>
  );
}
