import { useFieldContext } from "@/hooks/form-context";

type NumberFieldProps = {
  label: string;
  placeholder?: string;
}

export default function NumberField(props: NumberFieldProps) {
  const field = useFieldContext<number | null>();

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm/6 font-medium text-gray-900 dark:text-white">
        {props.label}
      </label>
      <div className="mt-2">
        <input
          id={field.name}
          name={field.name}
          type={"number"}
          value={field.state.value || undefined}
          placeholder={props.placeholder}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          onBlur={field.handleBlur}
          onChange={e => field.handleChange(e.target.valueAsNumber)}
        />
      </div>
    </div>
  )
}
