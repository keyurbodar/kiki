import type { SVGProps } from "react";

export type CapyIconProps = SVGProps<SVGSVGElement>;

function CapyIcon({ children, ...props }: CapyIconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

/** pull-request */
export function PullRequestIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <circle
        cx="6"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 6H15C16.6569 6 18 7.34315 18 9V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4L12 6L14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** draft */
export function DraftIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <circle
        cx="6.5"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.51 6H17.5M18 6C18 6.27614 17.7761 6.5 17.5 6.5C17.2239 6.5 17 6.27614 17 6C17 5.72386 17.2239 5.5 17.5 5.5C17.7761 5.5 18 5.72386 18 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.51 11.25H17.5M18 11.25C18 11.5261 17.7761 11.75 17.5 11.75C17.2239 11.75 17 11.5261 17 11.25C17 10.9739 17.2239 10.75 17.5 10.75C17.7761 10.75 18 10.9739 18 11.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** merged */
export function MergedIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <circle
        cx="6"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6H15C16.6569 6 18 7.34315 18 9V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** request-closed */
export function RequestClosedIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <circle
        cx="6.5"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 11V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** shield-crossed */
export function ShieldCrossedIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** chevron-right-small */
export function ChevronRightSmallIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** chevron-down-small */
export function ChevronDownSmallIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** dot-grid-1x3-horizontal */
export function DotGrid1x3HorizontalIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** square-behind-square-2 */
export function SquareBehindSquare2Icon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** arrow-share-right */
export function ArrowShareRightIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M21.6956 11.2833L14.629 4.40271C13.9953 3.78568 12.9314 4.23469 12.9314 5.11918V7.99977C12.9314 8.27591 12.7036 8.49935 12.4275 8.50341C4.47224 8.6202 2.01619 11.5656 1.9336 19.5722C1.93251 19.6777 2.07478 19.7147 2.12292 19.6208C3.50171 16.9313 4.74379 15.5583 12.4265 15.5016C12.7026 15.4996 12.9314 15.7236 12.9314 15.9998V18.8804C12.9314 19.7648 13.9953 20.2139 14.629 19.5968L21.6956 12.7162C22.0988 12.3237 22.0988 11.6759 21.6956 11.2833Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** branch */
export function BranchIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <circle
        cx="6.5"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17.5"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 8V9C17.5 10.6569 16.1569 12 14.5 12H9.5C7.84315 12 6.5 13.3431 6.5 15V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** bubble-2 */
export function Bubble2Icon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M6.00195 4H18.002C19.6588 4 21.002 5.34315 21.002 7V15C21.002 16.6569 19.6588 18 18.002 18H12.002L7.00195 21V18H6.00195C4.3451 18 3.00195 16.6569 3.00195 15V7C3.00195 5.34315 4.3451 4 6.00195 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** plus-large */
export function PlusLargeIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </CapyIcon>
  );
}

/** cross-medium */
export function CrossMediumIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </CapyIcon>
  );
}

/** branch-simple */
export function BranchSimpleIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 3.5V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 6C10.0294 6 6 10.0294 6 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </CapyIcon>
  );
}

/** user */
export function UserIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M7.75 20C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12C15.5713 12 17.8774 14.1946 18.797 17.0463C19.3055 18.6232 17.9069 20 16.25 20H7.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="7.75"
        r="4.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** tag */
export function TagIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5C7 7.22386 7.22386 7 7.5 7C7.77614 7 8 7.22386 8 7.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M3 10.7574V6C3 4.34315 4.34315 3 6 3H10.7574C11.553 3 12.3161 3.31607 12.8787 3.87868L20.1287 11.1287C21.3003 12.3003 21.3003 14.1997 20.1287 15.3713L15.3713 20.1287C14.1997 21.3003 12.3003 21.3003 11.1287 20.1287L3.87868 12.8787C3.31607 12.3161 3 11.553 3 10.7574Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M7.39844 7.5H7.59844"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** circle-dashed */
export function CircleDashedIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
      />
    </CapyIcon>
  );
}

/** checkmark-1 */
export function Checkmark1Icon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** minus-small */
export function MinusSmallIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M7 12H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </CapyIcon>
  );
}

/** arrow-up-right */
export function ArrowUpRightIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M18 15V6M18 6H9M18 6L6.25 17.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** commits */
export function CommitsIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 12H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 12H17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** arrow-undo-up */
export function ArrowUndoUpIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M6.49977 5L3.56043 7.93934C2.97465 8.52513 2.97465 9.47487 3.56043 10.0607L6.49977 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 9H16.5C18.9853 9 21 11.0147 21 13.5C21 15.9853 18.9853 18 16.5 18H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}

/** arrow-up */
export function ArrowUpIcon(props: CapyIconProps) {
  return (
    <CapyIcon {...props}>
      <path
        d="M12 5V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10L12 4L18 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CapyIcon>
  );
}
