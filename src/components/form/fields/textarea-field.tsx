import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";

export function TextareaField({
  description,
  label,
}: {
  description?: string;
  label: string;
}) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} description={description}>
      {(control) => (
        <textarea
          {...control}
          className="textarea h-96 w-lg max-w-full font-mono"
          spellCheck={false}
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </Field>
  );
}
