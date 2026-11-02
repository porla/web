export type SessionsGet = {
  session: Session;
};

export type Session = {
  id: number;
  name: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  state: null | {
    is_listening: boolean;
    is_paused: boolean;
    torrents_total: number;
  };
};

export type SessionSettings = Record<string, string | number | boolean>;

export type SessionsList = {
  sessions: Session[];
};

export type SessionsSettingsGet = {
  settings: SessionSettings;
};

export type SessionTimers = {
  timer_dht_stats?: number | null;
  timer_save_state?: number | null;
  timer_session_stats?: number | null;
  timer_torrent_updates?: number | null;
};
