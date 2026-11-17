import type { ComponentProps } from "react";

export type HomePageProps = ComponentProps<"div">;

export function HomePage(props: HomePageProps) {
  return <div {...props} />;
}
