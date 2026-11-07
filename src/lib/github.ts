import { HttpError } from "@/api";

// GitHub's latest release. A non-2xx reply (e.g. the 403 rate limit) throws an
// HttpError, so the global error handler shows it (4xx without retrying)
// instead of the badge silently not appearing.
export async function latestRelease(
  repo: string,
): Promise<{ tag_name: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
  );

  const body = (await res.json().catch(() => null)) as {
    tag_name: string;
    message?: string;
  } | null;

  if (!res.ok || !body) {
    throw new HttpError(
      res.status,
      `Checking ${repo} for updates failed: ${body?.message ?? res.statusText}`,
    );
  }

  return body;
}
