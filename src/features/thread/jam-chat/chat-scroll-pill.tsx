import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";

const count = new Intl.NumberFormat();

const pillButton = cx(
  "relative flex h-7 cursor-pointer items-center justify-center rounded-(--radius-card) px-2.5 text-xs whitespace-nowrap text-muted-foreground hover:text-foreground",
  "focus-visible:outline-ring-inset",
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
);

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      data-slot="icon"
      data-icon="arrow-down"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M18 14L12 20L6 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type ChatScrollPillProps = ComponentProps<"button"> & {
  visible?: boolean;
  messagesBelow?: number;
};

/** "Scroll to end" pill that floats above the composer while the chat is scrolled up. */
export function ChatScrollPill({
  visible = true,
  messagesBelow = 0,
  className,
  ...props
}: ChatScrollPillProps) {
  const label =
    messagesBelow > 0
      ? `Scroll to end, ${messagesBelow} ${messagesBelow === 1 ? "message" : "messages"} below`
      : "Scroll to end";
  return (
    <div
      data-slot="chat-scroll-pill"
      className={cx(
        "pointer-events-none absolute inset-x-0 bottom-3 z-(--z-top-bar) flex justify-center transition-[opacity,translate] motion-reduce:translate-y-0",
        visible
          ? "translate-y-0 opacity-100 duration-base ease-out-quint"
          : "translate-y-1.5 opacity-0 duration-base ease-linear",
        className,
      )}
    >
      <div
        inert={!visible}
        className={cx(
          "grid shrink-0 transition-[grid-template-columns,opacity,margin] ease-out-quint motion-reduce:transition-[opacity]",
          visible
            ? "grid-cols-[1fr] opacity-100 duration-base"
            : "-mr-1.5 grid-cols-[0fr] opacity-0 duration-exit",
        )}
      >
        <div className="pointer-events-auto -m-0.5 min-w-0 overflow-hidden p-0.5">
          <div className="flex flex-col rounded-(--radius-card) border-(length:--border-width-hairline) border-[var(--card-hairline,var(--border-1))] bg-card shadow-card">
            <button
              type="button"
              aria-label={label}
              className={cx(pillButton, "gap-1.5")}
              {...props}
            >
              <ArrowDown className="size-(--icon-sm) shrink-0" />
              <span
                aria-hidden
                className="grid items-center justify-items-center whitespace-nowrap"
              >
                <span
                  className={cx(
                    "col-start-1 row-start-1 transition-opacity duration-base ease-linear",
                    messagesBelow === 0 ? "opacity-100" : "opacity-0",
                  )}
                >
                  Scroll to end
                </span>
                <span
                  className={cx(
                    "col-start-1 row-start-1 inline-flex items-baseline transition-opacity duration-base ease-linear",
                    messagesBelow > 0 ? "opacity-100" : "opacity-0",
                  )}
                >
                  <span className="tabular-nums">
                    {count.format(Math.max(1, messagesBelow))}
                  </span>
                  <span className="whitespace-pre"> message</span>
                  <span
                    className={cx(
                      "transition-opacity duration-base ease-linear",
                      messagesBelow > 1 ? "opacity-100" : "opacity-0",
                    )}
                  >
                    s
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
