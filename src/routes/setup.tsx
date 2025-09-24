import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { prefixPath } from '../base';

export const Route = createFileRoute('/setup')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      username: "",
      password: ""
    },
    onSubmit: async ({ value }) => {
      const response = await fetch(prefixPath("/api/v1/auth/init"), {
        body: JSON.stringify(value),
        method: "POST"
      });

      if (response.status !== 200) {
        throw new Error(response.statusText);
      }

      await navigate({ to: "/" });
    }
  });

  return (
    <div className="w-md mx-auto border bg-gray-600 rounded mt-5 p-5 text-white">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col space-y-3"
      >
        <form.Field
          name="username"
          children={(field) => {
            return (
              <div className="flex">
                <label>Username</label>
                <input
                  className="border p-2"
                  type="text"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )
          }}
        />

        <form.Field
          name="password"
          children={(field) => {
            return (
              <div className="flex">
                <label>Password</label>
                <input
                  type="password"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )
          }}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button type="submit" disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Submit'}
            </button>
          )}
        />
      </form>
    </div >
  )
}
