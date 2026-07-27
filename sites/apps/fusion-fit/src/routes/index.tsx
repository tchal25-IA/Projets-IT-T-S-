import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Landing always goes to login (never hang on auth-gated routine)
    throw redirect({ to: "/login" });
  },
});
