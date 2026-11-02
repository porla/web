import { useRPC } from "@/api";
import { feature } from "@/lib/features";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export const Route = createFileRoute("/_app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const plugins = useRPC("plugins.list");
  const presets = useRPC("presets.list");
  const sessions = useRPC("sessions.list");

  return (
    <div className="w-6xl max-w-full mx-auto pt-9 px-6 pb-14">
      <header>
        <Link to="/" className="btn btn-ghost btn-sm -ml-2.5">
          <ChevronLeft className="size-4" />
          Back to Porla
        </Link>

        <h1 className="mt-2.5 text-[1.75rem] leading-tight font-semibold tracking-[-.02em]">
          Settings
        </h1>
      </header>

      <nav
        aria-label="Settings"
        className="tabs tabs-border border-b border-base-300"
      >
        <SettingsTab to="/settings" exact>
          Overview
        </SettingsTab>
        <SettingsTab
          to="/settings/sessions"
          count={sessions.data?.sessions.length}
        >
          Sessions
        </SettingsTab>
        <SettingsTab
          to="/settings/presets"
          count={presets.data?.presets.length}
        >
          Presets
        </SettingsTab>
        <SettingsTab
          to="/settings/plugins"
          count={plugins.data?.plugins.length}
        >
          Plugins
        </SettingsTab>
        {feature("api_keys") && <ApiKeysTab />}
        <SettingsTab to="/settings/mmdb">MMDB</SettingsTab>
        <SettingsTab to="/settings/views">Views</SettingsTab>
      </nav>

      <div className="pt-6">
        <Outlet />
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const keys = useRPC("auth.keys.list");

  return (
    <SettingsTab to="/settings/api-keys" count={keys.data?.keys.length}>
      API keys
    </SettingsTab>
  );
}

// `count` shows as a badge, "-" while it loads; leave the prop out for none.
function SettingsTab({
  to,
  exact,
  children,
  ...rest
}: {
  to: ComponentProps<typeof Link>["to"];
  exact?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="tab gap-1.5"
      activeProps={{ className: "tab-active" }}
      activeOptions={{ exact }}
    >
      {children}
      {"count" in rest && (
        <span className="badge badge-xs badge-info">{rest.count ?? "-"}</span>
      )}
    </Link>
  );
}
