// depending on backend features, adapt the responses

import type { Plugin } from "@/api";

export function pluginInfo(p: Plugin) {
  return {
    name: p.manifest?.name ?? p.name ?? p.path.split(/[\\/]/).pop(),
    version: p.manifest?.version ?? p.version ?? null,
    loaded: p.status ? p.status === "running" : !!p.is_loaded,
    // Why it isn't running; older Porla only logs it.
    error: p.error ?? null,
  };
}

export function pluginRelease(p: Plugin) {
  const { source, owner, repository, version } = p.metadata;

  if (
    source !== "github" ||
    typeof owner !== "string" ||
    typeof repository !== "string" ||
    typeof version !== "string"
  ) {
    return null;
  }

  return { repo: `${owner}/${repository}`, version };
}
