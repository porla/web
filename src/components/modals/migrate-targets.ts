import type { Session } from "@/api";

// No session_id means the default session (Sessions::Resolve). The backend
// refuses the torrent's own session and sessions that aren't loaded.
export function migrateTargets(sessions: Session[], from: number | undefined) {
  const source = from ?? sessions.find((s) => s.is_default)?.id;

  return sessions.filter((s) => s.state !== null && s.id !== source);
}
