import z from "zod";

// "/…" or "C:\…": Porla runs on Linux, macOS or Windows.
export const isAbsolutePath = (path: string) =>
  /^(\/|[A-Za-z]:[\\/])/.test(path);

export const absolutePath = (message = "Use an absolute path") =>
  z
    .string()
    .trim()
    .min(1, { error: "Enter a path", abort: true })
    .refine(isAbsolutePath, message);
