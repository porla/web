import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "./form-context";

// A field's validation errors, once it's touched (submitting touches every
// field). Function validators give strings, zod gives issue objects.
export function FieldErrors({ id }: { id?: string }) {
  const field = useFieldContext<unknown>();

  const errors = useSelector(field.store, (state) => state.meta.errors);
  const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

  if (!isTouched || errors.length === 0) {
    return null;
  }

  return (
    <div id={id} className="text-error">
      {errors.map((error, i) => (
        <div key={i}>{typeof error === "string" ? error : error?.message}</div>
      ))}
    </div>
  );
}
