import { type SysVersions, useRPC } from "@/api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const versions = useRPC<SysVersions>("sys.versions");
  return (
    <main className="text-sm">
      <pre>
        <code>{JSON.stringify(versions.data, null, 2)}</code>
      </pre>
    </main>
  );
}
