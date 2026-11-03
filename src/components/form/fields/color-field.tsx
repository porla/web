import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";

export function ColorField({
  fallback = "#000000",
  label,
}: {
  fallback?: string;
  label: string;
}) {
  const field = useFieldContext<string>();

  return (
    <Field label={label}>
      {(control) => (
        <input
          {...control}
          type="color"
          className="size-8 rounded-md cursor-pointer outline-0 border-0"
          value={field.state.value ?? fallback}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </Field>
  );
}
