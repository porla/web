import { type SessionsList, type SysVersions, useInvoker, useRPC } from "@/api";
import { prefixPath } from "@/base";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { parse } from "semver";

export const Route = createLazyFileRoute("/_status/settings/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const kv = useRPC<any>("kv.get", {
    keys: ["porla.webui.repo"],
  });

  const sessions = useRPC<SessionsList>("sessions.list", null, {
    refetchInterval: 2000,
  });

  const versions = useRPC<SysVersions>("sys.versions");

  const [webVersion, setWebVersion] = useState<string | null>();

  const repo = kv.data?.values["porla.webui.repo"] ?? "porla/web";

  const coreRelease = useQuery({
    queryKey: ["gh.core.release"],
    queryFn: () =>
      fetch(`https://api.github.com/repos/porla/porla/releases/latest`).then(
        (r) => r.json(),
      ),
    enabled: false,
  });

  const webRelease = useQuery({
    queryKey: ["gh.webui.release"],
    queryFn: () =>
      fetch(`https://api.github.com/repos/${repo}/releases/latest`).then((r) =>
        r.json(),
      ),
    enabled: false,
  });

  useEffect(() => {
    fetch(prefixPath("/version.json"))
      .then((r) => r.json())
      .then((r) => setWebVersion(r.SemVer))
      .catch((_) => setWebVersion("0.0.0"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Overview</h2>

        <button
          className="btn btn-primary"
          onClick={() => {
            coreRelease.refetch();
            webRelease.refetch();
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
              {versions.isLoading && (
                <span className="loading loading-spinner loading-xl"></span>
              )}

              {!versions.isLoading && versions.data && (
                <span>{versions.data.porla.version}</span>
              )}
            </div>
            <div className="stat-desc">
              {coreRelease.isFetching && (
                <span className="loading loading-spinner loading-xs"></span>
              )}

              {!coreRelease.isFetching && coreRelease.data && versions.data && (
                <VersionBadge
                  current={versions.data.porla.version}
                  latest={coreRelease.data.tag_name}
                />
              )}

              {!coreRelease.isLoading && !coreRelease.data && <>&nbsp;</>}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Web UI version</div>
            <div className="stat-value font-mono">{webVersion}</div>
            <div className="stat-actions">
              {webRelease.isFetching && (
                <span className="loading loading-spinner loading-xs"></span>
              )}

              {!webRelease.isFetching && webRelease.data && (
                <WebUIVersionAction
                  current={webVersion ?? "0.0.0"}
                  latest={webRelease.data.tag_name}
                />
              )}

              {!webRelease.isLoading && !webRelease.data && <>&nbsp;</>}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Torrents</div>
            <div className="stat-value font-mono">
              {sessions.isLoading && (
                <span className="loading loading-spinner loading-xl"></span>
              )}

              {!sessions.isLoading && sessions.data && (
                <span>
                  {sessions.data.sessions.reduce(
                    (sum, s) => sum + (s.state?.torrents_total ?? 0),
                    0,
                  )}
                </span>
              )}
            </div>
            <div className="stat-desc">In all sessions</div>
          </div>
          <div className="stat">
            <div className="stat-title">Sessions</div>
            <div className="stat-value font-mono">
              {sessions.isLoading && (
                <span className="loading loading-spinner loading-xl"></span>
              )}

              {!sessions.isLoading && sessions.data && (
                <span>{sessions.data.sessions.length}</span>
              )}
            </div>
            <div className="stat-desc">
              {sessions.isLoading && <>&nbsp;</>}
              {!sessions.isLoading && sessions.data && (
                <span>
                  {
                    sessions.data.sessions.filter(
                      (s) => s.state && !s.state.is_paused,
                    ).length
                  }{" "}
                  running,
                  {
                    sessions.data.sessions.filter(
                      (s) => s.state && s.state.is_paused,
                    ).length
                  }{" "}
                  paused
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type VersionBadgeProps = {
  current: string;
  latest: string;
};

function VersionBadge({ current, latest }: VersionBadgeProps) {
  const parsed_current = parse(current);
  const parsed_latest = parse(latest);

  if (parsed_current === null || parsed_latest === null) {
    return <></>;
  }

  if (parsed_latest > parsed_current) {
    return (
      <span className="badge badge-xs badge-warning">
        {parsed_latest.version} available
      </span>
    );
  }

  return <span className="badge badge-xs badge-success">Up to date</span>;
}

type WebUIVersionActionProps = {
  current: string;
  latest: string;
};

function WebUIVersionAction({ current, latest }: WebUIVersionActionProps) {
  const install = useInvoker("webui.install");

  const parsed_current = parse(current);
  const parsed_latest = parse(latest);

  if (parsed_current === null || parsed_latest === null) {
    return <></>;
  }

  if (parsed_latest > parsed_current) {
    return (
      <button
        className="btn btn-xs btn-info"
        disabled={install.isPending}
        onClick={async () => {
          install.mutateAsync({
            version: latest,
          });

          // TODO: hacky since the key-update signal is posted to the io thread, so we
          // need some space for the UI zip to reload
          setTimeout(() => location.reload(), 1000);
        }}
      >
        Install {parsed_latest.version}
      </button>
    );
  }

  return <span className="badge badge-xs badge-success">Up to date</span>;
}
