import { type SVGProps, useId } from "react";
import { cx } from "../shared";
import { awsPaths } from "./aws-paths";

type BrandIconProps = SVGProps<SVGSVGElement>;

const brandClass = (className?: string) =>
  cx("size-(--icon-base) opacity-100", className);

export function GoogleCloudIcon({ className, ...props }: BrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      className={brandClass(className)}
      {...props}
    >
      <path
        fill="#ea4535"
        d="M80.6 40.3h.4l-.2-.2 14-14v-.3c-11.8-10.4-28.1-14-43.2-9.5C36.5 20.8 24.9 32.8 20.7 48c.2-.1.5-.2.8-.2 5.2-3.4 11.4-5.4 17.9-5.4 2.2 0 4.3.2 6.4.6.1-.1.2-.1.3-.1 9-9.9 24.2-11.1 34.6-2.6h-.1z"
      />
      <path
        fill="#557ebf"
        d="M108.1 47.8c-2.3-8.5-7.1-16.2-13.8-22.1L80 39.9c6 4.9 9.5 12.3 9.3 20v2.5c16.9 0 16.9 25.2 0 25.2H63.9v20h-.1l.1.2h25.4c14.6.1 27.5-9.3 31.8-23.1 4.3-13.8-1-28.8-13-36.9z"
      />
      <path
        fill="#36a852"
        d="M39 107.9h26.3V87.7H39c-1.9 0-3.7-.4-5.4-1.1l-15.2 14.6v.2c6 4.3 13.2 6.6 20.7 6.6z"
      />
      <path
        fill="#f9bc15"
        d="M40.2 41.9c-14.9.1-28.1 9.3-32.9 22.8-4.8 13.6 0 28.5 11.8 37.3l15.6-14.9c-8.6-3.7-10.6-14.5-4-20.8 6.6-6.4 17.8-4.4 21.7 3.8L68 55.2C61.4 46.9 51.1 42 40.2 42.1z"
      />
    </svg>
  );
}

export function AwsIcon({ className, ...props }: BrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      className={brandClass(className)}
      {...props}
    >
      {awsPaths.map((path) => (
        <path key={path.fill} fill={path.fill} d={path.d} />
      ))}
    </svg>
  );
}

export function VaultIcon({ className, ...props }: BrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={brandClass(className)}
      {...props}
    >
      <path
        fill="#ffcf25"
        d="m1 1 10.96 21.334L23 1zm9.256 8.469H8.51V7.723h1.746zm0-2.62H8.51V5.105h1.746zm2.618 5.238h-1.746v-1.746h1.746zm0-2.618h-1.746V7.723h1.746zm0-2.62h-1.746V5.105h1.746zm2.604 2.62h-1.746V7.723h1.746zm-1.746-2.62V5.105h1.746v1.744z"
      />
    </svg>
  );
}

export function AzureIcon({ className, ...props }: BrandIconProps) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      className={brandClass(className)}
      {...props}
    >
      <defs>
        <linearGradient
          id={`${id}-a`}
          x1="60.919"
          y1="9.602"
          x2="18.667"
          y2="134.423"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#114A8B" />
          <stop offset="1" stopColor="#0669BC" />
        </linearGradient>
        <linearGradient
          id={`${id}-b`}
          x1="74.117"
          y1="67.772"
          x2="64.344"
          y2="71.076"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopOpacity=".3" />
          <stop offset=".071" stopOpacity=".2" />
          <stop offset=".321" stopOpacity=".1" />
          <stop offset=".623" stopOpacity=".05" />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-c`}
          x1="68.742"
          y1="5.961"
          x2="115.122"
          y2="129.525"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3CCBF4" />
          <stop offset="1" stopColor="#2892DF" />
        </linearGradient>
      </defs>
      <path
        d="M46.09.002h40.685L44.541 125.137a6.485 6.485 0 01-6.146 4.413H6.733a6.482 6.482 0 01-5.262-2.699 6.474 6.474 0 01-.876-5.848L39.944 4.414A6.488 6.488 0 0146.09 0z"
        fill={`url(#${id}-a)`}
        transform="translate(.587 4.468) scale(.91904)"
      />
      <path
        d="M97.28 81.607H37.987a2.743 2.743 0 00-1.874 4.751l38.1 35.562a5.991 5.991 0 004.087 1.61h33.574z"
        fill="#0078d4"
      />
      <path
        d="M46.09.002A6.434 6.434 0 0039.93 4.5L.644 120.897a6.469 6.469 0 006.106 8.653h32.48a6.942 6.942 0 005.328-4.531l7.834-23.089 27.985 26.101a6.618 6.618 0 004.165 1.519h36.396l-15.963-45.616-46.533.011L86.922.002z"
        fill={`url(#${id}-b)`}
        transform="translate(.587 4.468) scale(.91904)"
      />
      <path
        d="M98.055 4.408A6.476 6.476 0 0091.917.002H46.575a6.478 6.478 0 016.137 4.406l39.35 116.594a6.476 6.476 0 01-6.137 8.55h45.344a6.48 6.48 0 006.136-8.55z"
        fill={`url(#${id}-c)`}
        transform="translate(.587 4.468) scale(.91904)"
      />
    </svg>
  );
}

type StrokeIconProps = SVGProps<SVGSVGElement>;

function StrokeIcon({ children, ...props }: StrokeIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CloudIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path
        d="M7 19C4.23858 19 2 16.7614 2 14C2 11.4673 3.88316 9.37436 6.32568 9.04508C7.13649 6.69118 9.37075 5 12 5C15.3137 5 18 7.68629 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H7Z"
        {...stroke}
      />
    </StrokeIcon>
  );
}

export function RotateClockwiseIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path
        d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8"
        {...stroke}
      />
      <path d="M19 4V8H15" {...stroke} />
    </StrokeIcon>
  );
}

export function TrashIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path
        d="M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5"
        {...stroke}
      />
      <path d="M10 11V16" {...stroke} />
      <path d="M14 11V16" {...stroke} />
      <path d="M3.5 6H20.5" {...stroke} />
      <path
        d="M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621"
        {...stroke}
      />
    </StrokeIcon>
  );
}

export function DotsHorizontalIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        {...stroke}
      />
      <path
        d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z"
        {...stroke}
      />
      <path
        d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z"
        {...stroke}
      />
    </StrokeIcon>
  );
}

export function ChevronDownSmallIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...stroke}
      />
    </StrokeIcon>
  );
}

export function CopyIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path
        d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
        {...stroke}
      />
    </StrokeIcon>
  );
}
