import z from "zod";

// The backend's rules for torrent limits (utils/limits.hpp), shared by the
// properties dialog and the add page. An empty field is null: unchanged, or
// the preset's value when adding.
export const rateLimit = z
  .number()
  .int("Enter a whole number")
  .min(-1, "Use -1 for unlimited")
  .nullable();

export const peerLimit = z
  .number()
  .int("Enter a whole number")
  .refine((n) => n === -1 || n === 0 || n >= 2, "Use -1 for unlimited, or 2+")
  .nullable();
