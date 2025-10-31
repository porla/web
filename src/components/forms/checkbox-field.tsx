import { useFieldContext } from "@/hooks/form-context";

type CheckboxFieldProps = {
  label: string;
  placeholder?: string;
}

export default function CheckboxField(props: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm/6 font-medium text-gray-900 dark:text-white">
        {props.label}
      </label>
      <div className="mt-2">
        <div className="group grid size-4 grid-cols-1">

          <input
            id={field.name}
            name={field.name}
            type={"checkbox"}
            checked={field.state.value}
            placeholder={props.placeholder}
            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto" onBlur={field.handleBlur}
            onChange={e => field.handleChange(e.target.checked)}
          />
          <svg
            fill="none"
            viewBox="0 0 14 14"
            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25"
          >
            <path
              d="M3 8L6 11L11 3.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 group-has-checked:opacity-100"
            />
            <path
              d="M3 7H11"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 group-has-indeterminate:opacity-100"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
