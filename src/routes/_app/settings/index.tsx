import { POLL_MS, useInvoker, useRPC } from "@/api";
import { LogsSection } from "@/components/logs/logs-section";
import { Spinner } from "@/components/ui/spinner";
import { feature } from "@/lib/features";
import { latestRelease } from "@/lib/github";
import { useWebVersion } from "@/lib/web-version";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gt, parse } from "semver";

export const Route = createFileRoute("/_app/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const kv = useRPC("kv.get", {
    keys: ["porla.webui.owner", "porla.webui.repository"],
  });

  const sessions = useRPC("sessions.list", null, {
    refetchInterval: POLL_MS.details,
  });

  const list = sessions.data?.sessions;

  const versions = useRPC("sys.versions");
  const webVersion = useWebVersion();

  const owner = kv.data?.values["porla.webui.owner"];
  const repository = kv.data?.values["porla.webui.repository"];
  const repo = `${typeof owner === "string" ? owner : "porla"}/${typeof repository === "string" ? repository : "web"}`;

  const coreRelease = useQuery({
    queryKey: ["gh.core.release"],
    queryFn: () => latestRelease("porla/porla"),
    enabled: false,
  });

  const webRelease = useQuery({
    queryKey: ["gh.webui.release", repo],
    queryFn: () => latestRelease(repo),
    enabled: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Overview</h2>

        <button
          className="btn btn-primary"
          onClick={() => {
            void coreRelease.refetch();
            void webRelease.refetch();
          }}
        >
          Check for updates
        </button>
      </div>
      <div>
        <div className="stats shadow w-full bg-base-200">
          <div className="stat">
            <div className="stat-title">Porla version</div>
            <div className="stat-value font-mono">
              {versions.data?.porla.version ??
                (versions.isLoading && <Spinner size="xl" />)}
            </div>
            <div className="stat-desc">
              {coreRelease.isFetching ? (
                <Spinner size="xs" />
              ) : coreRelease.data && versions.data ? (
                <UpdateStatus
                  current={versions.data.porla.version}
                  latest={coreRelease.data.tag_name}
                />
              ) : (
                <>&nbsp;</>
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Web UI version</div>
            <div className="stat-value font-mono">{webVersion}</div>
            <div className="stat-actions">
              {webRelease.isFetching ? (
                <Spinner size="xs" />
              ) : webRelease.data ? (
                <UpdateStatus
                  current={webVersion ?? "0.0.0"}
                  latest={webRelease.data.tag_name}
                  installable
                />
              ) : (
                <>&nbsp;</>
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Torrents</div>
            <div className="stat-value font-mono">
              {list
                ? list.reduce(
                    (sum, s) => sum + (s.state?.torrents_total ?? 0),
                    0,
                  )
                : sessions.isLoading && <Spinner size="xl" />}
            </div>
            <div className="stat-desc">In all sessions</div>
          </div>
          <div className="stat">
            <div className="stat-title">Sessions</div>
            <div className="stat-value font-mono">
              {list ? list.length : sessions.isLoading && <Spinner size="xl" />}
            </div>
            <div className="stat-desc">
              {list ? (
                `${list.filter((s) => s.state && !s.state.is_paused).length} running, ${list.filter((s) => s.state?.is_paused).length} paused`
              ) : (
                <>&nbsp;</>
              )}
            </div>
          </div>
        </div>
      </div>

      {feature("logs") && <LogsSection />}
    </div>
  );
}

// The web UI can install its update; Porla's is only shown.
function UpdateStatus({
  current,
  latest,
  installable,
}: {
  current: string;
  latest: string;
  installable?: boolean;
}) {
  const install = useInvoker("webui.install");

  const now = parse(current);
  const next = parse(latest);

  if (!now || !next) {
    return null;
  }

  if (!gt(next, now)) {
    return <span className="badge badge-xs badge-success">Up to date</span>;
  }

  if (!installable) {
    return (
      <span className="badge badge-xs badge-warning">
        {next.version} available
      </span>
    );
  }

  return (
    <button
      className="btn btn-xs btn-info"
      disabled={install.isPending}
      onClick={() =>
        install.mutate(
          { version: latest },
          { onSuccess: () => location.reload() },
        )
      }
    >
      Install {next.version}
    </button>
  );
}
