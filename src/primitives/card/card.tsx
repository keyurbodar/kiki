import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const cardVariants = cva("", {
  variants: {
    variant: { default: "", interactive: "", panel: "", ghost: "" },
    rows: { true: "" },
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

export function CardHeader(props: CardHeaderProps) {
  return <div data-slot="card-header" {...props} />;
}

export type CardTitleProps = ComponentProps<"div">;

export function CardTitle(props: CardTitleProps) {
  return <div data-slot="card-title" {...props} />;
}

export type CardContentProps = ComponentProps<"div">;

export function CardContent(props: CardContentProps) {
  return <div data-slot="card-content" {...props} />;
}

export type CardFooterProps = ComponentProps<"div">;

export function CardFooter(props: CardFooterProps) {
  return <div data-slot="card-footer" {...props} />;
}

export type CardListHeaderProps = ComponentProps<"div">;

export function CardListHeader(props: CardListHeaderProps) {
  return <div data-slot="card-list-header" {...props} />;
}
