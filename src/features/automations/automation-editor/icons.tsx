import type { ReactNode, SVGProps } from "react";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

const stroke = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type GlyphShapeProps = GlyphProps & { name: string; paths: ReactNode };

function Glyph({ name, paths, className, ...props }: GlyphShapeProps) {
  return (
    <svg
      aria-hidden
      data-icon={name}
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? "size-(--icon-base) shrink-0"}
      {...props}
    >
      {paths}
    </svg>
  );
}

const glyph = (name: string, paths: ReactNode) => (props: GlyphProps) => (
  <Glyph name={name} paths={paths} {...props} />
);

export const ChevronDownSmall = glyph(
  "chevron-down-small",
  <path
    d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
    {...stroke}
  />,
);

export const ChevronRightSmall = glyph(
  "chevron-right-small",
  <path
    d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
    {...stroke}
  />,
);

export const DotsHorizontal = glyph(
  "dot-grid-1x3-horizontal",
  <>
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
  </>,
);

export const PlusMedium = glyph(
  "plus-medium",
  <path d="M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5" {...stroke} />,
);

export const CrossMedium = glyph(
  "cross-medium",
  <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" {...stroke} />,
);

export const Checkmark = glyph(
  "checkmark-1",
  <path d="M5 12.75L10 19L19 5" {...stroke} />,
);

export const ArrowShareRight = glyph(
  "arrow-share-right",
  <path
    d="M21.6956 11.2833L14.629 4.40271C13.9953 3.78568 12.9314 4.23469 12.9314 5.11918V7.99977C12.9314 8.27591 12.7036 8.49935 12.4275 8.50341C4.47224 8.6202 2.01619 11.5656 1.9336 19.5722C1.93251 19.6777 2.07478 19.7147 2.12292 19.6208C3.50171 16.9313 4.74379 15.5583 12.4265 15.5016C12.7026 15.4996 12.9314 15.7236 12.9314 15.9998V18.8804C12.9314 19.7648 13.9953 20.2139 14.629 19.5968L21.6956 12.7162C22.0988 12.3237 22.0988 11.6759 21.6956 11.2833Z"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
  />,
);

export const TrashCan = glyph(
  "trash-can",
  <>
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
  </>,
);

export const EditSmall = glyph(
  "edit-small-1",
  <>
    <path
      d="M11 4H8.8C7.11984 4 6.27976 4 5.63803 4.32698C5.07354 4.6146 4.6146 5.07354 4.32698 5.63803C4 6.27976 4 7.11984 4 8.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2V13"
      {...stroke}
    />
    <path
      d="M13 11V7.99998L17.5 3.49998C18.3284 2.67156 19.6716 2.67156 20.5 3.49998C21.3284 4.32841 21.3284 5.67155 20.5 6.49998L16 11H13Z"
      {...stroke}
    />
  </>,
);

export const Repeat = glyph(
  "repeat",
  <path
    d="M7 18H6C4.34315 18 3 16.6569 3 15V7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V15C21 16.6569 19.6569 18 18 18H13M15 15L12 18L15 21"
    {...stroke}
  />,
);

export const BubbleWide = glyph(
  "bubble-wide",
  <path
    d="M3.00195 7.00002C3.00195 5.34317 4.3451 4.00002 6.00195 4.00002L18.0019 4C19.6588 4 21.002 5.34314 21.002 7V15.0358C21.002 16.6926 19.6588 18.0357 18.002 18.0358L15.3757 18.0358C15.1427 18.0358 14.9171 18.1171 14.7377 18.2657L11.9977 20.5358L9.29398 18.2694C9.11393 18.1185 8.8865 18.0358 8.65157 18.0358H6.00195C4.3451 18.0358 3.00195 16.6926 3.00195 15.0358L3.00195 7.00002Z"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
  />,
);

export const Lock = glyph(
  "lock",
  <>
    <path
      d="M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z"
      {...stroke}
    />
    <path
      d="M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5"
      {...stroke}
    />
    <path d="M12 14V17" {...stroke} />
  </>,
);

export const Globe = glyph(
  "globe",
  <>
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
  </>,
);

export const CalendarClock = glyph(
  "calendar-clock",
  <>
    <path
      d="M2.75879 10.1637L3.62703 15.0877C3.91474 16.7194 5.47072 17.8089 7.1024 17.5212L10.0972 16.9931M2.75879 10.1637L2.58514 9.17888C2.29743 7.5472 3.38694 5.99122 5.01862 5.70351L11.9123 4.48797C13.544 4.20026 15.0999 5.28977 15.3876 6.92145C15.4835 7.46535 15.1204 7.984 14.5765 8.07991L2.75879 10.1637Z"
      {...stroke}
    />
    <path
      d="M16 20C19.3137 20 22 17.3137 22 14C22 10.6863 19.3137 8 16 8C12.6863 8 10 10.6863 10 14C10 17.3137 12.6863 20 16 20Z"
      {...stroke}
    />
    <path d="M16 12V14L17.6667 15.6667" {...stroke} />
  </>,
);
