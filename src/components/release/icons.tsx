import type { SVGProps } from "react";

export type GlyphProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CrossMediumIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="cross-medium" {...props}>
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function ChevronRightSmallIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="chevron-right-small" {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ChevronLeftSmallIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="chevron-left-small" {...props}>
      <path
        d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ArrowUpRightIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="arrow-up-right" {...props}>
      <path
        d="M18 15V6M18 6H9M18 6L6.25 17.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CircleDashedIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="circle-dashed" {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
      />
    </Glyph>
  );
}

export function GiftBoxIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="gift-box" {...props}>
      <path
        d="M18 5H6C4.34315 5 3 6.34315 3 8C3 8.55228 3.44772 9 4 9H20C20.5523 9 21 8.55228 21 8C21 6.34315 19.6569 5 18 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 9V16C20 17.6569 18.6569 19 17 19H7C5.34315 19 4 17.6569 4 16V9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function MacbookIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="macbook" {...props}>
      <path
        d="M2 16H22V17.5C22 18.8807 20.8807 20 19.5 20H4.5C3.11929 20 2 18.8807 2 17.5V16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M20 15.75V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V15.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CloudSimpleIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="cloud-simple" {...props}>
      <path
        d="M17 19H9C5.13401 19 2 15.866 2 12C2 8.13401 5.13401 5 9 5C11.5628 5 13.8039 6.37723 15.0236 8.43195C15.2884 8.87791 15.8167 9.11316 16.3308 9.0444C16.5497 9.01512 16.7731 9 17 9C19.7614 9 22 11.2386 22 14C22 16.7614 19.7614 19 17 19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ImportIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="import" {...props}>
      <path
        d="M3 9V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5H7C9.76142 5 12 7.23858 12 10V15M12 15L15.75 11.25M12 15L8.25 11.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function GithubIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="github" {...props}>
      <path
        d="M12 1.95068C17.525 1.95068 22 6.42568 22 11.9507C21.9995 14.0459 21.3419 16.0883 20.1198 17.7902C18.8977 19.4922 17.1727 20.768 15.1875 21.4382C14.6875 21.5382 14.5 21.2257 14.5 20.9632C14.5 20.6257 14.5125 19.5507 14.5125 18.2132C14.5125 17.2757 14.2 16.6757 13.8375 16.3632C16.0625 16.1132 18.4 15.2632 18.4 11.4257C18.4 10.3257 18.0125 9.43818 17.375 8.73818C17.475 8.48818 17.825 7.46318 17.275 6.08818C17.275 6.08818 16.4375 5.81318 14.525 7.11318C13.725 6.88818 12.875 6.77568 12.025 6.77568C11.175 6.77568 10.325 6.88818 9.525 7.11318C7.6125 5.82568 6.775 6.08818 6.775 6.08818C6.225 7.46318 6.575 8.48818 6.675 8.73818C6.0375 9.43818 5.65 10.3382 5.65 11.4257C5.65 15.2507 7.975 16.1132 10.2 16.3632C9.9125 16.6132 9.65 17.0507 9.5625 17.7007C8.9875 17.9632 7.55 18.3882 6.65 16.8757C6.4625 16.5757 5.9 15.8382 5.1125 15.8507C4.275 15.8632 4.775 16.3257 5.125 16.5132C5.55 16.7507 6.0375 17.6382 6.15 17.9257C6.35 18.4882 7 19.5632 9.5125 19.1007C9.5125 19.9382 9.525 20.7257 9.525 20.9632C9.525 21.2257 9.3375 21.5257 8.8375 21.4382C6.8458 20.7752 5.11342 19.502 3.88611 17.799C2.65881 16.096 1.9989 14.0498 2 11.9507C2 6.42568 6.475 1.95068 12 1.95068Z"
        fill="currentColor"
      />
    </Glyph>
  );
}

export function PullRequestIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="pull-request" {...props}>
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
    </Glyph>
  );
}

export function Server2Icon(props: GlyphProps) {
  return (
    <Glyph data-icon="server-2" {...props}>
      <path
        d="M19 5.5C19 6.88071 15.866 8 12 8C8.13401 8 5 6.88071 5 5.5M19 5.5C19 4.11929 15.866 3 12 3C8.13401 3 5 4.11929 5 5.5M19 5.5V18.5C19 19.8807 15.866 21 12 21C8.13401 21 5 19.8807 5 18.5V5.5M19 9.75C19 11.1307 15.866 12.25 12 12.25C8.13401 12.25 5 11.1307 5 9.75M19 14C19 15.3807 15.866 16.5 12 16.5C8.13401 16.5 5 15.3807 5 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function SlackIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="slack" {...props}>
      <path
        d="M6.36125 14.5772C6.36125 15.7106 5.44597 16.6266 4.3135 16.6266C3.18104 16.6266 2.26576 15.7106 2.26576 14.5772C2.26576 13.4439 3.18104 12.5279 4.3135 12.5279H6.36125V14.5772ZM7.38512 14.5772C7.38512 13.4439 8.3004 12.5279 9.43286 12.5279C10.5653 12.5279 11.4806 13.4439 11.4806 14.5772V19.7006C11.4806 20.834 10.5653 21.75 9.43286 21.75C8.3004 21.75 7.38512 20.834 7.38512 19.7006V14.5772Z"
        fill="currentColor"
      />
      <path
        d="M9.43262 6.34872C8.30016 6.34872 7.38488 5.43272 7.38488 4.29936C7.38488 3.166 8.30016 2.25 9.43262 2.25C10.5651 2.25 11.4804 3.166 11.4804 4.29936V6.34872H9.43262ZM9.43262 7.38893C10.5651 7.38893 11.4804 8.30493 11.4804 9.43829C11.4804 10.5717 10.5651 11.4877 9.43262 11.4877H4.29775C3.16528 11.4877 2.25 10.5717 2.25 9.43829C2.25 8.30493 3.16528 7.38893 4.29775 7.38893H9.43262Z"
        fill="currentColor"
      />
      <path
        d="M17.639 9.43829C17.639 8.30493 18.5543 7.38893 19.6867 7.38893C20.8192 7.38893 21.7345 8.30493 21.7345 9.43829C21.7345 10.5717 20.8192 11.4877 19.6867 11.4877H17.639V9.43829ZM16.6151 9.43829C16.6151 10.5717 15.6998 11.4877 14.5674 11.4877C13.4349 11.4877 12.5196 10.5717 12.5196 9.43829V4.29936C12.5196 3.166 13.4349 2.25 14.5674 2.25C15.6998 2.25 16.6151 3.166 16.6151 4.29936V9.43829Z"
        fill="currentColor"
      />
      <path
        d="M14.5674 17.6513C15.6998 17.6513 16.6151 18.5673 16.6151 19.7006C16.6151 20.834 15.6998 21.75 14.5674 21.75C13.4349 21.75 12.5196 20.834 12.5196 19.7006V17.6513H14.5674ZM14.5674 16.6266C13.4349 16.6266 12.5196 15.7106 12.5196 14.5772C12.5196 13.4439 13.4349 12.5279 14.5674 12.5279H19.7023C20.8347 12.5279 21.75 13.4439 21.75 14.5772C21.75 15.7106 20.8347 16.6266 19.7023 16.6266H14.5674Z"
        fill="currentColor"
      />
    </Glyph>
  );
}

export function PeopleAddIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="people-add" {...props}>
      <path
        d="M15.5 6.5C15.5 8.433 13.933 10 12 10C10.067 10 8.5 8.433 8.5 6.5C8.5 4.567 10.067 3 12 3C13.933 3 15.5 4.567 15.5 6.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9997 13.2499C13.3725 13.0868 12.7037 13 11.9997 13C9.02123 13 6.67402 14.5539 5.43304 16.8621C4.59593 18.4191 6.02717 20 7.79494 20H10.9997"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 15V18M18 18V21M18 18H15M18 18H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function BellIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="bell" {...props}>
      <path
        d="M4.58073 9.43467C5.10819 5.74248 8.2703 3 12 3C15.7296 3 18.8918 5.74248 19.4192 9.43467L20.0108 13.5757C20.269 15.383 18.8666 17 17.0409 17H6.959C5.13335 17 3.73096 15.383 3.98915 13.5757L4.58073 9.43467Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17C16 19.2091 14.2091 21 12 21C9.79086 21 8 19.2091 8 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ChainLink1Icon(props: GlyphProps) {
  return (
    <Glyph data-icon="chain-link-1" {...props}>
      <path
        d="M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15L15 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function BrowserTabsIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="browser-tabs" {...props}>
      <path
        d="M18 5H6C4.34315 5 3 6.34315 3 8V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8.5L10.5 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 8.5H17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 8.5H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function WindowAppIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="window-app" {...props}>
      <path
        d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 11H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7.25C6.41421 7.25 6.75 7.58579 6.75 8C6.75 8.41421 6.41421 8.75 6 8.75C5.58579 8.75 5.25 8.41421 5.25 8C5.25 7.58579 5.58579 7.25 6 7.25Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M9 7.25C9.41421 7.25 9.75 7.58579 9.75 8C9.75 8.41421 9.41421 8.75 9 8.75C8.58579 8.75 8.25 8.41421 8.25 8C8.25 7.58579 8.58579 7.25 9 7.25Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8C12.75 8.41421 12.4142 8.75 12 8.75C11.5858 8.75 11.25 8.41421 11.25 8C11.25 7.58579 11.5858 7.25 12 7.25Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </Glyph>
  );
}

export function RotateIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="rotate" {...props}>
      <path
        d="M12 3C12.5523 3 13 3.44772 13 4V11.5C13 12.0523 12.5523 12.5 12 12.5C11.4477 12.5 11 12.0523 11 11.5V4C11 3.44772 11.4477 3 12 3Z"
        fill="currentColor"
      />
      <path
        d="M12 17.5C12.5523 17.5 13 17.9477 13 18.5V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V18.5C11 17.9477 11.4477 17.5 12 17.5Z"
        fill="currentColor"
      />
      <path
        d="M15.0134 9.14842C15.1037 8.60356 15.6186 8.23503 16.1634 8.32529C17.704 8.58048 19.0686 8.98204 20.0774 9.51359C21.0018 10.0006 22 10.8028 22 12C22 12.852 21.4811 13.5044 20.9117 13.9532C20.331 14.4108 19.5528 14.7792 18.6802 15.07C16.9246 15.6552 14.5629 16 12 16C9.43715 16 7.07541 15.6552 5.31981 15.07C4.44724 14.7792 3.66896 14.4108 3.08829 13.9532C2.51889 13.5044 2 12.852 2 12C2 11.0084 2.69519 10.2899 3.39843 9.82287C4.08047 9.36997 4.98122 9.00461 6 8.72361V8.02873C6 7.61152 6.48085 7.37781 6.80891 7.63557L8.99962 9.35684C9.2544 9.55703 9.2544 9.94297 8.99962 10.1432L6.80891 11.8644C6.48085 12.1222 6 11.8885 6 11.4713V10.8116C5.35932 11.0217 4.8575 11.2548 4.5048 11.489C4.26654 11.6472 4.1301 11.7838 4.05946 11.8821C4.02579 11.9289 4.01128 11.9612 4.00523 11.9781C3.99986 11.9932 3.99999 11.9993 4 12C4 12.0009 3.99998 12.0052 4.00305 12.0153C4.00645 12.0264 4.01483 12.0485 4.03507 12.0814C4.07752 12.1506 4.16408 12.2545 4.32624 12.3823C4.65642 12.6425 5.19616 12.9206 5.95227 13.1726C7.45402 13.6732 9.59229 14 12 14C14.4077 14 16.546 13.6732 18.0477 13.1726C18.8038 12.9206 19.3436 12.6425 19.6738 12.3823C19.8359 12.2545 19.9225 12.1506 19.9649 12.0814C19.9852 12.0485 19.9935 12.0264 19.9969 12.0153C20 12.0052 20 12.001 20 12.0001C20 11.9994 20 11.9983 19.9997 11.9965L19.999 11.9926C19.998 11.9881 19.9956 11.9789 19.9895 11.9648C19.9768 11.9357 19.948 11.8844 19.8856 11.8137C19.7556 11.6663 19.5208 11.4809 19.1451 11.283C18.3948 10.8877 17.2595 10.5341 15.8366 10.2984C15.2917 10.2081 14.9232 9.69328 15.0134 9.14842Z"
        fill="currentColor"
      />
    </Glyph>
  );
}

export function Plugin1Icon(props: GlyphProps) {
  return (
    <Glyph data-icon="plugin-1" {...props}>
      <path
        d="M19 13V10C19 8.34315 17.6569 7 16 7H8C6.34315 7 5 8.34315 5 10V13C5 15.7614 7.23858 18 10 18H14C16.7614 18 19 15.7614 19 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ArrowLeftRightIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="arrow-left-right" {...props}>
      <path
        d="M7.49977 21L4.56043 18.0607C3.97465 17.4749 3.97465 16.5251 4.56043 15.9393L7.49977 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 11L19.4393 8.06066C20.0251 7.47487 20.0251 6.52513 19.4393 5.93934L16.5 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function MoonIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="moon" {...props}>
      <path
        d="M20.9638 12.7674C19.8361 13.5447 18.4693 13.9998 16.9961 13.9998C13.1301 13.9998 9.99609 10.8657 9.99609 6.99975C9.99609 5.52667 10.4511 4.15987 11.2283 3.03223C6.61911 3.42277 3 7.28768 3 11.9979C3 16.9674 7.0286 20.996 11.9981 20.996C16.7084 20.996 20.5734 17.3767 20.9638 12.7674Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function GlobeIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="globe" {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M21 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </Glyph>
  );
}

export function LinearIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="linear" {...props}>
      <path
        fill="currentColor"
        d="M2.24508 14.3046C2.20058 14.1149 2.42658 13.9954 2.56436 14.1332L9.86684 21.4356C10.0046 21.5734 9.88514 21.7994 9.69544 21.7549C6.0103 20.8904 3.10956 17.9897 2.24508 14.3046ZM2.00038 11.3778C1.99685 11.4345 2.01815 11.4898 2.05829 11.5299L12.4701 21.9417C12.5102 21.9818 12.5655 22.0032 12.6222 21.9996C13.096 21.9701 13.5609 21.9076 14.0147 21.8144C14.1676 21.783 14.2207 21.5952 14.1103 21.4848L2.51519 9.8897C2.40482 9.77932 2.21696 9.83244 2.18556 9.98534C2.09237 10.4391 2.02989 10.904 2.00038 11.3778ZM2.84219 7.94108C2.80889 8.01584 2.82585 8.1032 2.88372 8.16108L15.8389 21.1163C15.8968 21.1742 15.9842 21.1911 16.0589 21.1578C16.4161 20.9987 16.7623 20.8193 17.096 20.621C17.2064 20.5554 17.2235 20.4037 17.1327 20.3129L3.68713 6.86734C3.59631 6.77652 3.44459 6.79356 3.37898 6.90398C3.18072 7.23766 3.0013 7.58386 2.84219 7.94108ZM4.53174 5.6148C4.45772 5.54078 4.45314 5.42206 4.52288 5.34398C6.3559 3.29186 9.02228 2 11.9904 2C17.5185 2 22 6.48146 22 12.0096C22 14.9777 20.7081 17.6441 18.656 19.4771C18.578 19.5469 18.4592 19.5423 18.3852 19.4683L4.53174 5.6148Z"
      />
    </Glyph>
  );
}

export function AppleIcon(props: GlyphProps) {
  return (
    <Glyph data-icon="apple" {...props}>
      <path
        d="M15.0993 3.35783C14.3953 4.21083 13.2038 4.8472 12.256 4.8472C12.1477 4.8472 12.0394 4.83366 11.9717 4.82012C11.9581 4.76596 11.931 4.60348 11.931 4.44101C11.931 3.35783 12.4862 2.27466 13.0819 1.59768C13.8401 0.704062 15.1129 0.040619 16.1689 0C16.196 0.121857 16.2096 0.270793 16.2096 0.419729C16.2096 1.5029 15.7492 2.57253 15.0993 3.35783ZM15.844 5.07737C16.4397 5.07737 18.5925 5.13153 20.0007 7.16248C19.8788 7.25725 17.7395 8.46228 17.7395 11.1567C17.7395 14.2708 20.461 15.381 20.5423 15.4081C20.5287 15.4758 20.109 16.911 19.107 18.3868C18.2134 19.6731 17.2657 20.9729 15.844 20.9729C14.4088 20.9729 14.0432 20.1335 12.4049 20.1335C10.7937 20.1335 10.225 21 8.92523 21C7.61188 21 6.70473 19.795 5.66217 18.3327C4.44361 16.5996 3.46875 13.9188 3.46875 11.3733C3.46875 7.29787 6.12252 5.13153 8.73567 5.13153C10.1167 5.13153 11.2676 6.03868 12.1477 6.03868C12.9736 6.03868 14.2599 5.07737 15.844 5.07737Z"
        fill="currentColor"
      />
    </Glyph>
  );
}
