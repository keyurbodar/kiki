import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
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

export function PlusMediumIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MacbookIcon(props: IconProps) {
  return (
    <Svg {...props}>
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
    </Svg>
  );
}

export function StudioDisplayThunderboltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M9 17H6C4.34315 17 3 15.6569 3 14V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V14C21 15.6569 19.6569 17 18 17H15M9 17V20H15V17M9 17H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ServerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V12H3V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M3 12H21V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M6.5 14.625C6.98325 14.625 7.375 15.0168 7.375 15.5C7.375 15.9832 6.98325 16.375 6.5 16.375C6.01675 16.375 5.625 15.9832 5.625 15.5C5.625 15.0168 6.01675 14.625 6.5 14.625ZM6.5 7.625C6.98325 7.625 7.375 8.01675 7.375 8.5C7.375 8.98325 6.98325 9.375 6.5 9.375C6.01675 9.375 5.625 8.98325 5.625 8.5C5.625 8.01675 6.01675 7.625 6.5 7.625Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.75"
      />
    </Svg>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M7 19C4.23858 19 2 16.7614 2 14C2 11.4673 3.88316 9.37436 6.32568 9.04508C7.13649 6.69118 9.37075 5 12 5C15.3137 5 18 7.68629 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M18 15V6M18 6H9M18 6L6.25 17.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
