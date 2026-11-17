import { createFileRoute } from "@tanstack/react-router";
import { greeting } from "../lib/greeting";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <h1 className="font-semibold text-2xl">{greeting("kiki")}</h1>
    </main>
  );
}
