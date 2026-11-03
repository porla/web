import { absolutePath } from "@/lib/paths";
import z from "zod";

export const moveSchema = z.object({
  path: absolutePath("Use an absolute path, like /downloads"),
});

export const migrateSchema = z.object({
  session_id: z.number({ error: "Choose a target session" }),
});
