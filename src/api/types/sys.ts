export type SysStatus = {
  status: "ok" | "setup";
};

export type SysVersions = {
  porla: { branch: string; commitish: string; version: string };
  libtorrent: { revision: string; version: string };
  boost: { version: string };
  curl: { version: string };
  libzip: { version: string };
  maxminddb: { version: string };
  nlohmann_json: { version: string };
  openssl: { release_date: string; version: string; version_text: string };
  sqlite: { source_id: string; version: string };
};

export type MmdbEntry = {
  country?: { iso_code?: string; names?: Record<string, string> };
  [key: string]: unknown;
};
