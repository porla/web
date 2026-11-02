import z from "zod";

// porla reads limits into a C++ int; larger numbers wrap instead of failing.
const MAX = 2147483647;

// The backend's rules for torrent limits (utils/limits.hpp), shared by the
// properties dialog and the add page. An empty field is null: unchanged, or
// the preset's value when adding.
export const rateLimit = z
  .number()
  .int("Enter a whole number")
  .min(-1, "Use -1 for unlimited")
  .max(MAX, `At most ${MAX}`)
  .nullable();

export const peerLimit = z
  .number()
  .int("Enter a whole number")
  .max(MAX, `At most ${MAX}`)
  .refine((n) => n === -1 || n === 0 || n >= 2, "Use -1 for unlimited, or 2+")
  .nullable();
