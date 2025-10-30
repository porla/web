import { useFieldContext } from "@/hooks/form-context";

type ColorFieldProps = {
  label: string;
  placeholder?: string;
}

export default function ColorField(props: ColorFieldProps) {
  const field = useFieldContext<string>();

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm/6 font-medium text-gray-900 dark:text-white">
        {props.label}
      </label>
      <div className="mt-2 flex items-center space-x-3">
        <input
          id={field.name}
          name={field.name}
          type={"color"}
          value={field.state.value}
          placeholder={props.placeholder}
          className="size-8 rounded cursor-pointer outline-gray-300"
          onBlur={field.handleBlur}
          onChange={e => field.handleChange(e.target.value)}
        />

        <div className="flex-1 text-xs uppercase font-mono text-gray-400">
          {field.state.value}
        </div>
      </div>
    </div>
  )
}
