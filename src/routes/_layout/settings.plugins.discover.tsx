import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

type PluginsDiscoverSearch = {
  allow_github?: boolean;
}

export const Route = createFileRoute('/_layout/settings/plugins/discover')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): PluginsDiscoverSearch => {
    return {
      allow_github: !!search.allow_github
        ? Boolean(search.allow_github)
        : undefined
    };
  },

})

function RouteComponent() {
  const { allow_github } = Route.useSearch();

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
      <div className="px-3 py-3 flex items-center justify-between">
        <h1 className="font-medium">Discover plugins</h1>
      </div>
      {allow_github && (
        <ListReleases />
      )}

      {!allow_github && (
        <div className="px-5 py-4">
          <p className='text-sm text-gray-300'>Plugin discovery will make API queries directly to GitHub from your browser. This is generally harmless but we made this opt-in.</p>
          <div className="mt-3">
            <Link
              to="/settings/plugins/discover"
              search={{ allow_github: true }}
              className="rounded-md bg-indigo-50 px-2.5 py-1.5 text-sm font-semibold text-indigo-600 shadow-xs hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 dark:shadow-none dark:hover:bg-indigo-500/30"
            >
              Allow GitHub API queries
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ListReleases() {
  const ghPlugins = useQuery({
    queryKey: ["gh:plugins.discover"],
    queryFn: () => fetch("https://api.github.com/orgs/porla-plugins/repos?type=public&sort=full_name").then(r => r.json())
  });

  return (
    <table className="text-sm w-full">
      <thead>
        <tr>
          <th className="w-64 text-left text-gray-400 px-3 py-2 bg-gray-900">Name</th>
          <th className="text-left text-gray-400 px-3 py-2 bg-gray-900">Description</th>
          <th className="w-32 text-left text-gray-400 px-3 py-2 bg-gray-900">Latest version</th>
          <th className="w-auto"></th>
        </tr>
      </thead>
      <tbody>
        {ghPlugins.isLoading && (
          <tr>
            <td colSpan={3} className="flex items-center justify-center">
              <span>Loading plugins from GitHub</span>
            </td>
          </tr>
        )}

        {!ghPlugins.isLoading && ghPlugins.data?.map((p: any) => (
          <tr key={p.full_name}>
            <td className="px-3 py-1 font-bold">{p.name}</td>
            <td className="text-left px-3">{p.description}</td>
            <td className="px-3"><GitHubRepoRelease repo={p.full_name} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type GitHubRepoReleaseProps = {
  repo: string;
}

function GitHubRepoRelease(props: GitHubRepoReleaseProps) {
  const ghReleases = useQuery({
    queryKey: ["gh:releases.list", props.repo],
    queryFn: () => fetch(`https://api.github.com/repos/${props.repo}/releases`).then(r => r.json())
  });

  return (
    <>-</>
  )
}
