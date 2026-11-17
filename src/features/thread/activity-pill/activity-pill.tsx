import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";

export type ActivityPillProps = ComponentProps<"div">;

export function ActivityPill({ className, ...props }: ActivityPillProps) {
  return (
    <div
      className={cx(
        "flex flex-col rounded-(--radius-card) border-[length:--spacing(0.125)] border-(--card-hairline) bg-card shadow-card",
        className,
      )}
      {...props}
    />
  );
}

const fade = "transition-opacity duration-base ease-linear";

export type ScrollToEndPillProps = Omit<
  ComponentProps<"button">,
  "children"
> & {
  unread?: number;
};

export function ScrollToEndPill({
  unread = 0,
  className,
  ...props
}: ScrollToEndPillProps) {
  const counting = unread > 0;
  return (
    <ActivityPill>
      <button
        type="button"
        aria-label={
          counting
            ? `Scroll to end, ${unread} message${unread === 1 ? "" : "s"}`
            : "Scroll to end"
        }
        className={cx(
          "relative flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-(--radius-card) px-2.5 text-xs whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:outline-ring-inset pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className="grid items-center justify-items-center whitespace-nowrap"
        >
          <span
            className={cx(
              "col-start-1 row-start-1",
              fade,
              counting ? "opacity-0" : "opacity-100",
            )}
          >
            Scroll to end
          </span>
          <span
            className={cx(
              "col-start-1 row-start-1 inline-flex items-baseline",
              fade,
              counting ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="tabular-nums">{unread}</span>
            <span className="whitespace-pre"> message</span>
            <span
              className={cx(fade, unread === 1 ? "opacity-0" : "opacity-100")}
            >
              s
            </span>
          </span>
        </span>
      </button>
    </ActivityPill>
  );
}
