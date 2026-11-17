import type { SVGProps } from "react";
import { cx } from "../shared";
import awsSmileUrl from "./assets/aws-smile.svg?url";
import azureUrl from "./assets/azure.svg?url";
import gcpUrl from "./assets/gcp.svg?url";
import vaultUrl from "./assets/vault.svg?url";
import { awsWordmarkPath } from "./aws-paths";

type BrandIconProps = { className?: string };

const brandClass = (className?: string) =>
  cx("size-(--icon-base) opacity-100", className);

export function GoogleCloudIcon({ className }: BrandIconProps) {
  return (
    <img
      src={gcpUrl}
      alt=""
      aria-hidden="true"
      className={brandClass(className)}
    />
  );
}

export function AwsIcon({ className }: BrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={brandClass(className)}
    >
      <image href={awsSmileUrl} width="128" height="128" />
      <path fill="currentColor" d={awsWordmarkPath} />
    </svg>
  );
}

export function VaultIcon({ className }: BrandIconProps) {
  return (
    <img
      src={vaultUrl}
      alt=""
      aria-hidden="true"
      className={brandClass(className)}
    />
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

export function AzureIcon({ className }: BrandIconProps) {
  return (
    <img
      src={azureUrl}
      alt=""
      aria-hidden="true"
      className={brandClass(className)}
    />
  );
}
