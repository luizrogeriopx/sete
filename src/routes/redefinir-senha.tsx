import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/redefinir-senha")({
  beforeLoad: () => {
    throw redirect({
      to: "/auth",
      search: { modo: "redefinir" },
    });
  },
  component: () => null,
});
