import {
  infoHashKey,
  torrentSortFields,
  type InfoHash,
  type SortDir,
  type Torrent,
  type TorrentSortField,
  type TorrentStatusFilter,
} from "@/api";
import z from "zod";

export const statuses = [
  "downloading",
  "downloading_queued",
  "finished",
  "seeding",
  "seeding_queued",
  "paused",
  "error",
] as const satisfies readonly TorrentStatusFilter[];

export const pageSizes = [25, 50, 100, 200] as const;

export type PageSize = (typeof pageSizes)[number];

export const DEFAULT_PAGE_SIZE = 50;

export const detailTabs = [
  "general",
  "files",
  "pieces",
  "peers",
  "trackers",
] as const;

export type DetailTab = (typeof detailTabs)[number];

export type TorrentSearch = {
  page?: number;
  page_size?: PageSize;
  order_by?: TorrentSortField;
  order_by_dir?: SortDir;
  query?: string;
  session_id?: number;
  category?: string;
  tag?: string;
  status?: TorrentStatusFilter[];
  selected_info_hash?: InfoHash;
  selected_session_id?: number;
  selected_tab_id?: DetailTab;
};

// Hand-edited or stale URLs: a value that doesn't fit is dropped instead of
// reaching the backend (a bare ?status=paused used to fail to deserialize).
const id = z.coerce.number().int().min(1).optional().catch(undefined);
const text = z.string().min(1).optional().catch(undefined);

export const searchSchema = z.object({
  page: id,
  page_size: z.coerce
    .number()
    .pipe(z.union(pageSizes.map((n) => z.literal(n))))
    .optional()
    .catch(undefined),
  order_by: z.enum(torrentSortFields).optional().catch(undefined),
  order_by_dir: z.enum(["asc", "desc"]).optional().catch(undefined),
  query: text,
  session_id: id,
  category: text,
  tag: text,
  status: z
    .preprocess(
      (v) => (typeof v === "string" ? [v] : v),
      z.array(z.enum(statuses)).optional(),
    )
    .catch(undefined),
  selected_info_hash: z
    .union([
      z.tuple([z.string().nullable(), z.string().nullable()]),
      z.string(),
    ])
    .optional()
    .catch(undefined),
  selected_session_id: id,
  selected_tab_id: z.enum(detailTabs).optional().catch(undefined),
});

export function isSelected(search: TorrentSearch, t: Torrent) {
  return (
    !!search.selected_info_hash &&
    infoHashKey(search.selected_info_hash) === infoHashKey(t.info_hash) &&
    search.selected_session_id === search.session_id
  );
}

export function withoutSelection<S extends TorrentSearch>(search: S): S {
  return {
    ...search,
    selected_info_hash: undefined,
    selected_session_id: undefined,
    selected_tab_id: undefined,
  };
}
