import { cva, cx, type VariantProps } from "class-variance-authority";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";

export const cardVariants = cva("flex flex-col overflow-clip", {
  variants: {
    variant: {
      default:
        "bg-card rounded-(--radius-card) border-hairline border-(--card-hairline) shadow-card",
      interactive:
        "bg-card rounded-(--radius-card) border-hairline border-(--card-hairline) shadow-card cursor-pointer select-none transition-colors duration-100 hover:bg-card-hover focus-visible:outline-ring-inset",
      panel:
        "bg-panel md:rounded-(--radius-panel) md:border-hairline md:border-(--card-hairline) md:shadow-card",
      ghost: "bg-transparent rounded-(--radius-card)",
    },
    rows: { true: "divide-y-hairline divide-border-1" },
  },
  defaultVariants: { variant: "default" },
});

export type CardProps = ComponentProps<"div"> &
  VariantProps<typeof cardVariants>;

export function Card({ className, variant, rows, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cardVariants({ variant, rows, className })}
      {...props}
    />
  );
}

export type CardHeaderProps = ComponentProps<"div">;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cx(
        "flex items-center gap-2 border-b-hairline border-border-1 px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = ComponentProps<"div">;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cx("text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

export type CardContentProps = ComponentProps<"div">;

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div data-slot="card-content" className={cx("p-4", className)} {...props} />
  );
}

export type CardFooterProps = ComponentProps<"div">;

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cx(
        "flex items-center justify-end gap-2 border-t-hairline border-border-1 px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export type CardListHeaderSearch = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export type CardListHeaderProps = Omit<ComponentProps<"div">, "children"> & {
  label?: ReactNode;
  action?: ReactNode;
  search?: CardListHeaderSearch;
  tools?: ReactNode;
};

export function CardListHeader({
  label,
  action,
  search,
  tools,
  className,
  ...props
}: CardListHeaderProps) {
  const [searching, setSearching] = useState(false);
  const searchOpen = search !== undefined && (searching || search.value !== "");
  return (
    <div
      data-slot="card-list-header"
      className={cx(
        "flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {searchOpen ? (
          <Input
            variant="blank"
            size="sm"
            className="-ml-2"
            autoFocus
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              search.onChange("");
              setSearching(false);
            }}
            onBlur={() => {
              if (search.value === "") setSearching(false);
            }}
          />
        ) : (
          label
        )}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {search !== undefined && !searchOpen && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={search.placeholder}
            title={search.placeholder}
            onClick={() => setSearching(true)}
          >
            <Icon name="magnifying-glass" size={null} />
          </Button>
        )}
        {searchOpen && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            title="Clear search"
            onClick={() => {
              search.onChange("");
              setSearching(false);
            }}
          >
            <Icon name="cross-medium" size={null} />
          </Button>
        )}
        {tools}
        {action}
      </div>
    </div>
  );
}
