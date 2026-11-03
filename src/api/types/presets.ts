import type { TorrentFlag } from "./torrents";

export type PresetsGet = {
  preset: Preset;
};

export type PresetsList = {
  presets: Pick<Preset, "id" | "name" | "is_default" | "metadata">[];
};

export type Preset = {
  id: number;
  name: string;
  is_default: boolean;
  category: string | null;
  download_limit: number | null;
  flags: TorrentFlag[] | null;
  flags_mask: TorrentFlag[] | null;
  max_connections: number | null;
  max_uploads: number | null;
  metadata: Record<string, unknown>;
  session_id: number | null;
  save_path: string | null;
  storage_mode: "allocate" | "sparse" | null;
  tags: string[];
  upload_limit: number | null;
};

// Optional backend fields accept both an absent key and null.
export type PresetFields = {
  category?: string | null;
  download_limit?: number | null;
  flags?: TorrentFlag[] | null;
  flags_mask?: TorrentFlag[] | null;
  max_connections?: number | null;
  max_uploads?: number | null;
  save_path?: string | null;
  session_id?: number | null;
  storage_mode?: "allocate" | "sparse" | null;
  upload_limit?: number | null;
};
