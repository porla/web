import Button from "@/components/button";
import { useInvoker, useRPC, type Plugin } from "@/jsonrpc";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/plugins/$id")({
  component: RouteComponent,
  params: {
    parse: (p) => {
      return { id: Number(p.id) };
    },
  },
});

function RouteComponent() {
  const { id } = Route.useParams();

  const plugin = useRPC<Plugin>("plugins.get", { id });
  const reload = useInvoker("plugins.reload");
  const remove = useInvoker("plugins.remove");

  if (plugin.isLoading) {
    return <>loading plugin</>;
  }

  if (!plugin.data) {
    return <>plugin not found</>;
  }

  return (
    <div>
      <h1>{plugin.data.name}</h1>
      <ul>
        <li><Button text="Reload" onClick={async () => await reload({ id })} /></li>
        <li><Button text="Remove" onClick={async () => await remove({ id })} /></li>
      </ul>
    </div>
  );
}
