import { createFileRoute, redirect } from "@tanstack/react-router";
import { primaryPanelPath } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    throw redirect({ to: primaryPanelPath(roles as never) });
  },
  component: () => null,
});
