import {
  CatchBoundary,
  createFileRoute,
  Navigate,
  Outlet,
} from "@tanstack/react-router";
import { type SysVersions, useRPC, type SysStatus } from "@/api";
import Sidebar from "@/components/sidebar";
import { feature, featureRange, initializeFeatures } from "@/features";
import { MessageCircleWarning } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const status = useRPC<SysStatus>("sys.status");

  if (status.isLoading) {
    return <>Loading</>;
  }

  if (status.data && status.data.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return <SysVersionsLayout />;
}

function SysVersionsLayout() {
  const versions = useRPC<SysVersions>("sys.versions");

  if (versions.isLoading) {
    return <>loading versions</>;
  }

  const version = versions.data?.porla.version ?? null;

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

  initializeFeatures(version);

  return (
    <div className=" h-full flex flex-col">
      {!feature("base") && (
        <div className="alert alert-warning alert-soft rounded-none">
          <MessageCircleWarning />
          <span>
            Your version of Porla ({versions.data?.porla.version}) does not
            fulfill the base version range {featureRange("base")}. Consider
            updating.
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

      <div className="flex flex-1 h-full">
        <div className="bg-base-300 w-64 shrink-0">
          {boundary("sidebar", <Sidebar />)}
        </div>
        <div className="flex-1 min-w-0">{boundary("outlet", <Outlet />)}</div>
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
