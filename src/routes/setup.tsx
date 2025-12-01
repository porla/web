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
    <div className="pt-10">
      <div className="w-96 shadow-sm mx-auto card bg-base-200 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col space-y-3"
        >
          <h1>Create user account</h1>
          <form.Field
            name="username"
            children={(field) => {
              return (
                <input
                  type="text"
                  placeholder="Username"
                  className="input w-full"
                  required
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )
            }}
          />

          <form.Field
            name="password"
            children={(field) => {
              return (
                <input
                  type="password"
                  placeholder="Password"
                  className="input w-full"
                  required
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )
            }}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                {isSubmitting ? '...' : 'Submit'}
              </button>
            )}
          />
        </form>
      </div>
    </div>
  )
}
