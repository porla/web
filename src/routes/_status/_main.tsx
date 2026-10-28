import { CatchBoundary, createFileRoute, Outlet } from "@tanstack/react-router";
import Sidebar from "@/components/sidebar";
import {
  feature,
  featureRange,
  getCurrentVersion,
  getVersionError,
} from "@/features";
import { Menu, MessageCircleWarning } from "lucide-react";
import { useState, type ReactNode } from "react";
import { prefixPath } from "@/base";

export const Route = createFileRoute("/_status/_main")({
  component: RouteComponent,
});

function RouteComponent() {
  const version = getCurrentVersion();
  const versionError = getVersionError();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const boundary = (key: string, children: ReactNode) => (
    <CatchBoundary
      getResetKey={() => `${version ?? "unknown"}:${key}`}
      errorComponent={({ error, reset }) => (
        <BrokenPanel error={error} reset={reset} />
      )}
    >
      {children}
    </CatchBoundary>
  );

  return (
    // On small screens the sidebar is a drawer behind a top bar.
    <div className="drawer h-full lg:drawer-open">
      <input
        id="sidebar"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => setDrawerOpen(e.target.checked)}
      />
      <div className="drawer-content flex min-h-0 flex-col">
        <div className="navbar min-h-12 gap-2 border-b border-base-300 bg-base-200 lg:hidden">
          <label
            htmlFor="sidebar"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Open the sidebar"
          >
            <Menu className="size-5" />
          </label>
          <img src={prefixPath("/porla.svg")} alt="" className="size-6" />
          <span className="font-semibold">Porla</span>
        </div>

        {versionError && (
          <div className="alert alert-error alert-soft rounded-none">
            <MessageCircleWarning />
            <span>
              Couldn't read the Porla version
              {versionError.message ? ` (${versionError.message})` : ""}, so
              features that depend on it are turned off.
            </span>
          </div>
        )}

        {!versionError && !feature("base") && (
          <div className="alert alert-warning alert-soft rounded-none">
            <MessageCircleWarning />
            <span>
              Your version of Porla ({version?.toString()}) does not fulfill the
              base version range {featureRange("base")}. Consider updating.
            </span>
            <a
              className="btn btn-sm"
              href="https://github.com/porla/porla/releases"
              target="_blank"
            >
              View releases on GitHub
            </a>
          </div>
        )}

        {/* A fixed height, so the list keeps its search and paging in place;
            taller pages (add, …) scroll in here. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {boundary("outlet", <Outlet />)}
        </div>
      </div>
      <div className="drawer-side z-20">
        <label
          htmlFor="sidebar"
          className="drawer-overlay"
          aria-label="Close the sidebar"
        />
        <aside className="h-full w-64 border-r border-base-300 bg-base-200">
          {boundary(
            "sidebar",
            <Sidebar onNavigate={() => setDrawerOpen(false)} />,
          )}
        </aside>
      </div>
    </div>
  );
}

function BrokenPanel({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="p-6 space-y-3">
      <h2 className="font-semibold">This part of the app failed to load</h2>
      <p className="text-sm opacity-70">
        Most likely the server version above is too old for it.
      </p>
      <pre className="text-xs opacity-60 whitespace-pre-wrap">
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button className="btn btn-sm" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
