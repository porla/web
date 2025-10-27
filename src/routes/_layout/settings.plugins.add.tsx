import Button from "@/components/button";
import { useInvoker } from "@/jsonrpc";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/plugins/add")({
  component: RouteComponent,
});

function RouteComponent() {
  const pluginsAdd = useInvoker("plugins.add");

  return (
    <div className="p-5">
      <Button
        text="Add plugin"
        onClick={async () => {
          await pluginsAdd({
            type: "path",
            data: "/workspaces/porla/build/example-plugin"
          })
        }}
        />
    </div>
  );
}
