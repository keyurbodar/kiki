import { cva, type VariantProps } from "class-variance-authority";
import { Children, type ComponentProps, type ReactNode } from "react";
import { Icon } from "@/primitives/icon";
import { type Intent, intentVariants } from "@/primitives/intent";

export const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit min-w-8 rounded-full text-xs font-normal [text-box-trim:trim-both] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-hairline border-(--border-2) bg-(--button) text-[var(--intent-text,var(--fg))]",
        ghost:
          "bg-transparent text-[var(--intent-text,var(--muted-foreground-1))]",
        filled:
          "border-hairline border-[var(--intent-border-solid,var(--intent-border,var(--border-2)))] bg-[var(--intent-bg,var(--button))] text-[var(--intent-text-on-bg,var(--fg))] shadow-[inset_0_1px_var(--intent-highlight,var(--highlight-top)),var(--sh-plate)]",
      },
      color: intentVariants,
      size: {
        base: "h-(--h-badge-base) px-2 gap-1 [&_svg:not([class*='size-'])]:size-(--icon-sm) [&_svg:first-of-type]:-ml-0.5",
        sm: "h-(--h-badge-sm) px-1.5 gap-1 [&_svg:not([class*='size-'])]:size-(--icon-xs) [&_svg:first-of-type]:-ml-0.5",
        xs: "h-(--h-badge-xs) px-1.5 gap-1 [&_svg:not([class*='size-'])]:size-(--icon-xs) [&_svg:first-of-type]:-ml-0.5",
        count:
          "h-(--h-badge-count) min-w-0 px-0 text-count-chip font-bold proportional-nums [text-box-trim:none]",
        auto: "h-auto px-0.5 gap-1 [&_svg:not([class*='size-'])]:size-(--icon-xs)",
      },
      interactive: {
        true: "relative cursor-pointer outline-none transition-colors duration-100 focus-visible:outline-ring-inset hover:text-[var(--intent-text-hover,var(--fg))] data-[popup-open]:text-[var(--intent-text-hover,var(--fg))] pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
        false: "select-none",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "neutral",
      size: "base",
      interactive: false,
    },
  },
);

const glyphs = {
  success: "circle-check",
  warning: "exclamation-triangle",
  danger: "circle-x",
  info: "circle-info",
} as const satisfies Partial<Record<Intent, string>>;

export type BadgeProps = Omit<ComponentProps<"div">, "color"> &
  VariantProps<typeof badgeVariants> & {
    glyph?: boolean;
  };

export function Badge({
  className,
  variant,
  color,
  size,
  interactive,
  glyph = true,
  children,
  ...props
}: BadgeProps) {
  const isInteractive = interactive ?? props.onClick !== undefined;
  const glyphName =
    glyph &&
    color != null &&
    color in glyphs &&
    size !== "count" &&
    size !== "auto" &&
    Children.toArray(children).every(
      (child) => typeof child === "string" || typeof child === "number",
    )
      ? glyphs[color as keyof typeof glyphs]
      : undefined;
  const classes = badgeVariants({
    variant,
    color,
    size,
    interactive: isInteractive,
    className,
  });
  let content: ReactNode = children;
  if (size === "count") {
    content = (
      <span className="block leading-none [text-box:trim-both_cap_alphabetic]">
        {children}
      </span>
    );
  } else if (glyphName !== undefined) {
    content = (
      <>
        <Icon name={glyphName} size={null} />
        {children}
      </>
    );
  }
  if (isInteractive) {
    return (
      <button
        type="button"
        data-slot="badge"
        className={classes}
        {...(props as ComponentProps<"button">)}
      >
        {content}
      </button>
    );
  }
  return (
    <div data-slot="badge" className={classes} {...props}>
      {content}
    </div>
  );
}
