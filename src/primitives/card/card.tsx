import { cva, type VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import { cn } from "@/lib/cn";
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
      className={cn(
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
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

export type CardContentProps = ComponentProps<"div">;

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div data-slot="card-content" className={cn("p-4", className)} {...props} />
  );
}

export type CardFooterProps = ComponentProps<"div">;

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-end gap-2 border-t-hairline border-border-1 px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export type CardListHeaderSearch = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export type CardListHeaderProps = ComponentProps<"div"> & {
  label?: ReactNode;
  action?: ReactNode;
  tools?: ReactNode;
  search?: CardListHeaderSearch;
};

export function CardListHeader({
  label,
  action,
  tools,
  search,
  className,
  children,
  ...props
}: CardListHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const showSearch =
    search !== undefined && (searchOpen || search.value !== "");
  const interactive =
    label !== undefined ||
    search !== undefined ||
    tools !== undefined ||
    action !== undefined;

  const closeSearch = () => {
    search?.onChange("");
    setSearchOpen(false);
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") closeSearch();
  };

  return (
    <div
      data-slot="card-list-header"
      className={cn(
        "flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4",
        className,
      )}
      {...props}
    >
      {interactive ? (
        <>
          <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {search && showSearch ? (
              <Input
                variant="blank"
                size="sm"
                className="-ml-2"
                autoFocus
                placeholder={search.placeholder}
                aria-label={search.placeholder}
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                onKeyDown={onSearchKeyDown}
                onBlur={() => {
                  if (search.value === "") setSearchOpen(false);
                }}
              />
            ) : (
              label
            )}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            {search && !showSearch && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={search.placeholder}
                title={search.placeholder}
                onClick={() => setSearchOpen(true)}
              >
                <Icon name="magnifying-glass" />
              </Button>
            )}
            {search && showSearch && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                title="Clear search"
                onClick={closeSearch}
              >
                <Icon name="cross-medium" />
              </Button>
            )}
            {tools}
            {action}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
