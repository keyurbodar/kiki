import { Button, type ButtonProps } from "@/primitives/button";

export type LoadingButtonProps = ButtonProps;

export function LoadingButton({ ...props }: LoadingButtonProps) {
  return <Button {...props} />;
}
