import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

// A field's validation errors, once it's touched (submitting touches every
// field). Function validators give strings, zod gives issue objects.
export default function FieldErrors() {
  const field = useFieldContext<unknown>();

  const errors = useSelector(field.store, (state) => state.meta.errors);
  const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

  if (!isTouched) {
    return null;
  }

  return errors.map((error, i) => (
    <div key={i} className="text-red-400">
      {typeof error === "string" ? error : error?.message}
    </div>
  ));
}
