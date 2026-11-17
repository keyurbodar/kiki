import { cx } from "class-variance-authority";
import { createElement as h, type ReactNode, type SVGProps } from "react";

/*
 * Capy's icon components that the shared sprite does not ship yet, drawn the
 * way Capy's bundle draws them: a 24x24 outline glyph in currentColor.
 */

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  label,
  className,
  children,
  ...props
}: GlyphProps & { label: string; children?: ReactNode }) {
  return h(
    "svg",
    {
      "data-slot": "glyph",
      "data-glyph": label,
      "aria-hidden": true,
      viewBox: "0 0 24 24",
      fill: "none",
      className: cx("size-(--icon-sm) shrink-0", className),
      ...props,
    },
    children,
  );
}

/** dot-grid-1x3-horizontal */
export const DotsHorizontal = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "dot-grid-1x3-horizontal" },
    h(`path`, {
      d: `M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** arrow-rotate-clockwise */
export const ArrowRotateClockwise = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "arrow-rotate-clockwise" },
    h(`path`, {
      d: `M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M19 4V8H15`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** circle-x */
export const CircleX = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "circle-x" },
    h(`path`, {
      d: `M15 9L9 15M15 15L9 9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** bell-off */
export const BellOff = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "bell-off" },
    h(`path`, {
      d: `M16 17C16 19.2091 14.2091 21 12 21C9.79086 21 8 19.2091 8 17`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M6 6.19177C5.35964 7.14102 4.93708 8.25397 4.80754 9.46305L4.10941 13.4873C3.79116 15.3217 5.20338 17 7.06526 17H17`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M19.6786 14L19.1925 9.46301C18.7986 5.78732 15.6967 3 12 3C10.9336 3 9.91668 3.23195 9 3.65027`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M3 3L21 21`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** bell */
export const Bell = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "bell" },
    h(`path`, {
      d: `M4.58073 9.43467C5.10819 5.74248 8.2703 3 12 3C15.7296 3 18.8918 5.74248 19.4192 9.43467L20.0108 13.5757C20.269 15.383 18.8666 17 17.0409 17H6.959C5.13335 17 3.73096 15.383 3.98915 13.5757L4.58073 9.43467Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M16 17C16 19.2091 14.2091 21 12 21C9.79086 21 8 19.2091 8 17`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** arrow-share-right */
export const ArrowShareRight = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "arrow-share-right" },
    h(`path`, {
      d: `M21.6956 11.2833L14.629 4.40271C13.9953 3.78568 12.9314 4.23469 12.9314 5.11918V7.99977C12.9314 8.27591 12.7036 8.49935 12.4275 8.50341C4.47224 8.6202 2.01619 11.5656 1.9336 19.5722C1.93251 19.6777 2.07478 19.7147 2.12292 19.6208C3.50171 16.9313 4.74379 15.5583 12.4265 15.5016C12.7026 15.4996 12.9314 15.7236 12.9314 15.9998V18.8804C12.9314 19.7648 13.9953 20.2139 14.629 19.5968L21.6956 12.7162C22.0988 12.3237 22.0988 11.6759 21.6956 11.2833Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinejoin: `round`,
    }),
  );

/** square-behind-square-2 */
export const SquareBehindSquare = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "square-behind-square-2" },
    h(`path`, {
      d: `M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** arrow-corner-up-left */
export const ArrowCornerUpLeft = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "arrow-corner-up-left" },
    h(`path`, {
      d: `M20 19V12C20 10.3431 18.6569 9 17 9H5`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M8 13L4 9L8 5`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** circle-half-fill */
export const CircleHalfFill = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "circle-half-fill" },
    h(`path`, {
      fillRule: `evenodd`,
      clipRule: `evenodd`,
      d: `M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4V20ZM22 12C22 17.5228 17.5228 22 12 22C11.6252 22 11.2549 21.9793 10.8901 21.939C5.88912 21.3862 2 17.148 2 12C2 6.85205 5.88912 2.61382 10.8901 2.06098C11.2549 2.02066 11.6252 2 12 2C17.5228 2 22 6.47715 22 12Z`,
      fill: `currentColor`,
    }),
  );

/** flag-1 */
export const Flag = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "flag-1" },
    h(`path`, {
      d: `M5 15V4C5 3.44772 5.44772 3 6 3H19.1315C19.9302 3 20.4066 3.89015 19.9635 4.5547L17.3698 8.4453C17.1459 8.7812 17.1459 9.2188 17.3698 9.5547L19.9635 13.4453C20.4066 14.1099 19.9302 15 19.1315 15H5ZM5 15V21`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** calendar-1 */
export const Calendar = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "calendar-1" },
    h(`path`, {
      d: `M4 8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V8Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M4 10H20`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M8 5V3`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M16 5V3`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** chevron-down-small */
export const ChevronDownSmall = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "chevron-down-small" },
    h(`path`, {
      d: `M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** user */
export const User = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "user" },
    h(`path`, {
      d: `M7.75 20C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12C15.5713 12 17.8774 14.1946 18.797 17.0463C19.3055 18.6232 17.9069 20 16.25 20H7.75Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinejoin: `round`,
    }),
    h(`circle`, {
      cx: `12`,
      cy: `7.75`,
      r: `4.25`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinejoin: `round`,
    }),
  );

/** tag */
export const Tag = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "tag" },
    h(`path`, {
      d: `M8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5C7 7.22386 7.22386 7 7.5 7C7.77614 7 8 7.22386 8 7.5Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
    }),
    h(`path`, {
      d: `M3 10.7574V6C3 4.34315 4.34315 3 6 3H10.7574C11.553 3 12.3161 3.31607 12.8787 3.87868L20.1287 11.1287C21.3003 12.3003 21.3003 14.1997 20.1287 15.3713L15.3713 20.1287C14.1997 21.3003 12.3003 21.3003 11.1287 20.1287L3.87868 12.8787C3.31607 12.3161 3 11.553 3 10.7574Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M7.39844 7.5H7.59844`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
      strokeLinejoin: `round`,
    }),
  );

/** user-edit */
export const UserEdit = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "user-edit" },
    h(`path`, {
      d: `M10 20H7.75C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`circle`, {
      cx: `12`,
      cy: `7.75`,
      r: `4.25`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M14 20V17.9142C14 17.649 14.1054 17.3946 14.2929 17.2071L17.75 13.75C18.4404 13.0596 19.5596 13.0596 20.25 13.75C20.9404 14.4404 20.9404 15.5596 20.25 16.25L17.0858 19.4142C16.7107 19.7893 16.202 20 15.6716 20H14Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinejoin: `round`,
    }),
  );

/** pull-request */
export const PullRequest = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "pull-request" },
    h(`circle`, {
      cx: `6`,
      cy: `6`,
      r: `2`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`circle`, {
      cx: `6`,
      cy: `18`,
      r: `2`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`circle`, {
      cx: `18`,
      cy: `18`,
      r: `2`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M6 8V16`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M13 6H15C16.6569 6 18 7.34315 18 9V16`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M14 4L12 6L14 8`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** bubble-2 */
export const Bubble = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "bubble-2" },
    h(`path`, {
      d: `M6.00195 4H18.002C19.6588 4 21.002 5.34315 21.002 7V15C21.002 16.6569 19.6588 18 18.002 18H12.002L7.00195 21V18H6.00195C4.3451 18 3.00195 16.6569 3.00195 15V7C3.00195 5.34315 4.3451 4 6.00195 4Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
      strokeLinejoin: `round`,
    }),
  );

/** chain-link-1 */
export const ChainLink = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "chain-link-1" },
    h(`path`, {
      d: `M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M9 15L15 9`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** plus-large */
export const PlusLarge = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "plus-large" },
    h(`path`, {
      d: `M12 4V12M12 12V20M12 12H4M12 12H20`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
    }),
  );

/** cross-small */
export const CrossSmall = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "cross-small" },
    h(`path`, {
      d: `M8 8L16 16M16 8L8 16`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
    }),
  );

/** edit-small-1 */
export const EditSmall = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "edit-small-1" },
    h(`path`, {
      d: `M11 4H8.8C7.11984 4 6.27976 4 5.63803 4.32698C5.07354 4.6146 4.6146 5.07354 4.32698 5.63803C4 6.27976 4 7.11984 4 8.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2V13`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M13 11V7.99998L17.5 3.49998C18.3284 2.67156 19.6716 2.67156 20.5 3.49998C21.3284 4.32841 21.3284 5.67155 20.5 6.49998L16 11H13Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** chevron-right-small */
export const ChevronRightSmall = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "chevron-right-small" },
    h(`path`, {
      d: `M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** chevron-left-small */
export const ChevronLeftSmall = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "chevron-left-small" },
    h(`path`, {
      d: `M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** arrow-undo-up */
export const ArrowUndoUp = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "arrow-undo-up" },
    h(`path`, {
      d: `M6.49977 5L3.56043 7.93934C2.97465 8.52513 2.97465 9.47487 3.56043 10.0607L6.49977 13`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M4 9H16.5C18.9853 9 21 11.0147 21 13.5C21 15.9853 18.9853 18 16.5 18H12`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** lock */
export const Lock = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "lock" },
    h(`path`, {
      d: `M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M12 14V17`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** group-1 */
export const Group = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "group-1" },
    h(`path`, {
      d: `M9 10C7.067 10 5.5 8.433 5.5 6.5C5.5 4.567 7.067 3 9 3C10.933 3 12.5 4.567 12.5 6.5C12.5 8.433 10.933 10 9 10Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M15 3C16.933 3 18.5 4.567 18.5 6.5C18.5 8.433 16.933 10 15 10`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M9.00046 13C5.75801 13 2.9661 14.6879 1.70973 17.1143C0.947894 18.5856 2.3436 20 4.00046 20H14.0005C15.6573 20 17.053 18.5856 16.2912 17.1143C15.0348 14.6879 12.2429 13 9.00046 13Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M18 13.5088C20.0779 14.2448 21.722 15.7225 22.5034 17.5667C23.0421 18.838 21.8807 20 20.5 20`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** globe */
export const Globe = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "globe" },
    h(`path`, {
      d: `M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
    }),
    h(`path`, {
      d: `M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
    }),
    h(`path`, {
      d: `M21 12H3`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
    }),
  );

/** circle-ban-sign */
export const CircleBan = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "circle-ban-sign" },
    h(`path`, {
      d: `M21 12C21 16.9706 16.9706 21 12 21C9.51472 21 7.26472 19.9926 5.63604 18.364C4.00736 16.7353 3 14.4853 3 12C3 7.02944 7.02944 3 12 3C14.4853 3 16.7353 4.00736 18.364 5.63604C19.9926 7.26472 21 9.51472 21 12Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
    }),
    h(`path`, {
      d: `M18 6L6 18`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
    }),
  );

/** cross-medium */
export const CrossMedium = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "cross-medium" },
    h(`path`, {
      d: `M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
    }),
  );

/** paperclip-1 */
export const Paperclip = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "paperclip-1" },
    h(`path`, {
      d: `M6 11V15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15V7C18 4.79086 16.2091 3 14 3C11.7909 3 10 4.79086 10 7V15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15V7`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
    }),
  );

/** plus-medium */
export const PlusMedium = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "plus-medium" },
    h(`path`, {
      d: `M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
    }),
  );

/** crown */
export const Crown = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "crown" },
    h(`path`, {
      d: `M4.00247 16.6119L2 7L8 10L12 4L16 10L22 7L19.9975 16.6119C19.7077 18.003 18.4816 19 17.0606 19H6.93941C5.51839 19 4.2923 18.003 4.00247 16.6119Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
      strokeLinejoin: `round`,
    }),
  );

/** user-group */
export const People = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "user-group" },
    h(`circle`, {
      cx: `12`,
      cy: `9`,
      r: `3`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`circle`, {
      cx: `4`,
      cy: `9.5`,
      r: `2`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`circle`, {
      cx: `20`,
      cy: `9.5`,
      r: `2`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M10.0428 18C8.57631 18 7.22823 16.9033 7.56204 15.4752C8.01943 13.5185 9.48682 12 12.0014 12C14.5161 12 15.9835 13.5186 16.4408 15.4753C16.7746 16.9033 15.4266 18 13.96 18H10.0428Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M3.99878 16.9999H3.45795C2.02801 16.9999 0.655199 15.9269 1.10985 14.5712C1.53898 13.2916 2.57366 12.2942 3.99878 11.5698`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M20 17.0001H20.5406C21.9706 17.0001 23.3435 15.927 22.8888 14.5711C22.4596 13.2917 21.425 12.2944 20 11.5701`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** bubble-sparkle */
export const Threads = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "bubble-sparkle" },
    h(`path`, {
      d: `M4.00195 7.00002C4.00195 5.34317 5.3451 4.00002 7.00195 4.00002L17.0019 4.00001C18.6588 4 20.002 5.34315 20.002 7V15.0358C20.002 16.6926 18.6588 18.0358 17.002 18.0358L15.3757 18.0358C15.1427 18.0358 14.9171 18.1171 14.7377 18.2657L11.9977 20.5358L9.29398 18.2694C9.11393 18.1185 8.8865 18.0358 8.65157 18.0358H7.00195C5.3451 18.0358 4.00195 16.6926 4.00195 15.0358V7.00002Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M13.2395 9.43518L12.5426 7.62334C12.4561 7.39842 12.24 7.25 11.999 7.25C11.758 7.25 11.5419 7.39842 11.4554 7.62334L10.7586 9.43518C10.657 9.69927 10.4483 9.90797 10.1842 10.0095L8.37236 10.7064C8.14744 10.7929 7.99902 11.009 7.99902 11.25C7.99902 11.491 8.14744 11.7071 8.37236 11.7936L10.1842 12.4905C10.4483 12.592 10.657 12.8007 10.7586 13.0648L11.4554 14.8767C11.5419 15.1016 11.758 15.25 11.999 15.25C12.24 15.25 12.4561 15.1016 12.5426 14.8767L13.2395 13.0648C13.3411 12.8007 13.5498 12.592 13.8138 12.4905L15.6257 11.7936C15.8506 11.7071 15.999 11.491 15.999 11.25C15.999 11.009 15.8506 10.7929 15.6257 10.7064L13.8138 10.0095C13.5498 9.90797 13.3411 9.69927 13.2395 9.43518Z`,
      fill: `currentColor`,
    }),
  );

/** sparkle-2 */
export const Sparkle = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "sparkle-2" },
    h(`path`, {
      d: `M3 12C8 10.5 10.5 8 12 3C13.5 8 16 10.5 21 12C16 13.5 13.5 16 12 21C10.5 16 8 13.5 3 12Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `square`,
      strokeLinejoin: `round`,
    }),
  );

/** files */
export const Files = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "files" },
    h(`path`, {
      d: `M11 3H13.7574C14.553 3 15.3161 3.31607 15.8787 3.87868L19.1213 7.12132C19.6839 7.68393 20 8.44699 20 9.24264V15C20 16.6569 18.6569 18 17 18H11C9.34315 18 8 16.6569 8 15V6C8 4.34315 9.34315 3 11 3Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M17 18C17 19.6569 15.6569 21 14 21H8C6.34315 21 5 19.6569 5 18V9C5 7.34315 6.34315 6 8 6`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M15 3V6C15 7.10457 15.8954 8 17 8H20`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** arrow-up */
export const ArrowUp = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "arrow-up" },
    h(`path`, {
      d: `M12 5V20`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
    h(`path`, {
      d: `M6 10L12 4L18 10`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );

/** microphone */
export const Microphone = (props: GlyphProps) =>
  h(
    Glyph,
    { ...props, label: "microphone" },
    h(`path`, {
      d: `M12.0013 19V21M12.0013 19C8.32307 19 6.14811 16.7451 5.01562 15M12.0013 19C15.6795 19 17.8545 16.7451 18.987 15M16.0013 7V11C16.0013 13.2091 14.2104 15 12.0013 15C9.79215 15 8.00129 13.2091 8.00129 11V7C8.00129 4.79086 9.79215 3 12.0013 3C14.2104 3 16.0013 4.79086 16.0013 7Z`,
      stroke: `currentColor`,
      strokeWidth: `2`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    }),
  );
