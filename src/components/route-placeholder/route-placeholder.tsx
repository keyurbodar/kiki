export type RoutePlaceholderProps = {
  title: string;
  path: string;
};

export function RoutePlaceholder({ title, path }: RoutePlaceholderProps) {
  return (
    <main data-slot="route-placeholder" data-route={path}>
      <h1>{title}</h1>
      <p>{path}</p>
    </main>
  );
}
