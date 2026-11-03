import { notFound } from "@tanstack/react-router";
import z from "zod";

const positiveInt = z.coerce.number().int().positive();

export const idParam = {
  parse: ({ id }: { id: string }) => {
    const parsed = positiveInt.safeParse(id);
    if (!parsed.success) throw notFound();
    return { id: parsed.data };
  },
  stringify: ({ id }: { id: number }) => ({ id: String(id) }),
};
