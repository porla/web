import { HttpError, RpcError } from "@/api";
import { bytes } from "@/format";

// One torrent's options. Empty fields aren't sent, so presets (or porla's
// defaults) decide them.
export type AddOptions = {
  preset_id: number | null;
  session_id: number | null;
  save_path: string;
  category: string;
  tags: string;
  download_limit: number | null;
  upload_limit: number | null;
  max_connections: number | null;
  max_uploads: number | null;
};

export const emptyOptions: AddOptions = {
  preset_id: null,
  session_id: null,
  save_path: "",
  category: "",
  tags: "",
  download_limit: null,
  upload_limit: null,
  max_connections: null,
  max_uploads: null,
};

// A torrent in the add list: a chosen .torrent file or a magnet link, and
// why porla didn't take it, if it didn't.
export type Item = {
  id: number;
  name: string;
  detail: string;
  file?: File;
  uri?: string;
  adding?: boolean;
  error?: string;
  options: AddOptions;
};

let nextId = 1;

export const fileItem = (file: File, options: AddOptions): Item => ({
  id: nextId++,
  name: file.name,
  detail: bytes(file.size),
  file,
  options,
});

export const magnetItem = (uri: string, options: AddOptions): Item => ({
  id: nextId++,
  name: new URLSearchParams(uri.split("?")[1]).get("dn") || uri,
  detail: "magnet link",
  uri,
  options,
});

// The file as standard base64, which is what porla decodes.
export async function readTorrent(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < data.length; i += 0x8000) {
    binary += String.fromCharCode(...data.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function addParams(o: AddOptions) {
  const tags = [
    ...new Set(
      o.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ];
  return {
    ...o,
    save_path: o.save_path.trim() || null,
    category: o.category.trim() || null,
    tags: tags.length > 0 ? tags : null,
  };
}

export function addError(err: unknown) {
  if (err instanceof RpcError && err.code === -6) {
    return "Needs a save path: set one here or in a preset";
  }
  if (err instanceof HttpError && err.status === 413) {
    return "Too large for porla (8 MiB request limit)";
  }
  return err instanceof Error ? err.message : "Request failed";
}
