import { useInvoker, useRPC, useRpcCache } from "@/api";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsTable } from "@/components/settings/settings-table";
import { Spinner } from "@/components/ui/spinner";
import { feature } from "@/lib/features";
import { latestRelease } from "@/lib/github";
import { pluginInfo, pluginRelease } from "@/plugins/plugin-info";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";
import { gt, parse } from "semver";

export const Route = createFileRoute("/_app/settings/plugins/")({
  component: RouteComponent,
});

function RouteComponent() {
  const plugins = useRPC("plugins.list", undefined, {
    meta: { errorToast: false },
  });

  const repos = feature("plugin_upgrade")
    ? [
        ...new Set(
          (plugins.data?.plugins ?? []).flatMap(
            (p) => pluginRelease(p)?.repo ?? [],
          ),
        ),
      ]
    : [];

  const releases = useQueries({
    queries: repos.map((repo) => ({
      queryKey: ["gh.plugin.release", repo],
      queryFn: () => latestRelease(repo),
      enabled: false,
    })),
  });

  const releaseOf = (repo: string) => releases[repos.indexOf(repo)];

  return (
    <SettingsSection
      title="All plugins"
      action={
        <div className="flex flex-wrap justify-end gap-2">
          {repos.length > 0 && (
            <button
              className="btn btn-secondary"
              disabled={releases.some((r) => r.isFetching)}
              onClick={() => releases.forEach((r) => void r.refetch())}
            >
              Check for updates
            </button>
          )}
          <Link className="btn btn-primary" to="/settings/plugins/install">
            Install plugin
          </Link>
        </div>
      }
    >
      <SettingsTable
        query={plugins}
        rows={plugins.data?.plugins}
        what="plugins"
        emptyIcon={Puzzle}
        emptyHint="Install one from GitHub, or add one from a folder on this machine."
        head={
          <>
            <th>Name</th>
            <th>Path</th>
            <th></th>
          </>
        }
      >
        {(p) => {
          const release = repos.length > 0 ? pluginRelease(p) : null;

          return (
            <tr key={`plugin_${p.id}`}>
              <td className="">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{pluginInfo(p).name}</span>
                  {pluginInfo(p).version && (
                    <span className="text-xs opacity-60">
                      {pluginInfo(p).version}
                    </span>
                  )}
                  {!pluginInfo(p).loaded && (
                    <span className="badge badge-error badge-soft badge-sm">
                      Not loaded
                    </span>
                  )}
                </div>
              </td>
              <td className="">{p.path}</td>
              <td className="flex items-center justify-end gap-2">
                {release && (
                  <PluginUpdate
                    id={p.id}
                    current={release.version}
                    latest={releaseOf(release.repo)}
                  />
                )}

                <Link
                  to="/settings/plugins/$id"
                  className="btn btn-neutral btn-xs"
                  params={{ id: p.id }}
                >
                  Edit
                </Link>
              </td>
            </tr>
          );
        }}
      </SettingsTable>
    </SettingsSection>
  );
}

function PluginUpdate({
  id,
  current,
  latest,
}: {
  id: number;
  current: string;
  latest: UseQueryResult<{ tag_name: string }> | undefined;
}) {
  const cache = useRpcCache();

  const upgrade = useInvoker("plugins.upgrade", {
    onSuccess: () => cache.invalidate("plugins.list", "plugins.get"),
  });

  if (latest?.isFetching) {
    return <Spinner size="xs" />;
  }

  const tag = latest?.data?.tag_name;

  if (!tag) {
    return null;
  }

  if (!isNewer(tag, current)) {
    return <span className="badge badge-xs badge-success">Up to date</span>;
  }

  return (
    <button
      className="btn btn-xs btn-info"
      disabled={upgrade.isPending}
      onClick={() => upgrade.mutate({ id, version: tag })}
    >
      {upgrade.isPending && <Spinner size="xs" />}
      Upgrade to {tag}
    </button>
  );
}

// tags that aren't semver can't be ordered, so any other tag than the
// installed one counts as newer - GitHub's latest release skips drafts and
// prereleases
function isNewer(latest: string, current: string) {
  const next = parse(latest);
  const now = parse(current);

  return next && now ? gt(next, now) : latest !== current;
}
