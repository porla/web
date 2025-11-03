export const TorrentState = {
  downloading: 3,
  seeding: 5
}

export const TorrentFlags = {
  paused: 16,
  autoManaged: 24
}

export type Session = {
  id: number;
  name: string;
  is_default: boolean;
  is_listening: boolean;
  is_paused: boolean;
  metadata: Record<string, unknown>;
  torrents_total: number;
}

export type SessionSettings = {
}
