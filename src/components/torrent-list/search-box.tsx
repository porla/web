import { useForm } from "@tanstack/react-form";
import { getRouteApi } from "@tanstack/react-router";
import { SearchIcon, X } from "lucide-react";
import { useEffect } from "react";

const route = getRouteApi("/_app/_shell/");

export function SearchBox() {
  const navigate = route.useNavigate();
  const search = route.useSearch();

  const form = useForm({
    defaultValues: {
      query: search.query ?? "",
    },
    onSubmit: async ({ value }) => {
      await navigate({
        to: "/",
        search: {
          session_id: search.session_id,
          page_size: search.page_size,
          order_by: search.order_by,
          order_by_dir: search.order_by_dir,
          query: value.query.trim() || undefined,
          selected_info_hash: search.selected_info_hash,
          selected_session_id: search.selected_session_id,
          selected_tab_id: search.selected_tab_id,
        },
      });
    },
  });

  // The box follows the URL, e.g. when a sidebar filter clears the query.
  useEffect(() => {
    form.reset({ query: search.query ?? "" });
  }, [search.query, form]);

  return (
    <form
      className="min-w-48 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="query"
        children={(field) => (
          <label className="input w-full">
            <SearchIcon className="h-[1em] opacity-50" />
            <input
              className="grow font-mono"
              placeholder="Search"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {(field.state.value || search.query) && (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Clear the search"
                onClick={() => {
                  // also reset search form for any unsubmitted query
                  form.reset({ query: "" });

                  void navigate({
                    to: "/",
                    search: {
                      ...search,
                      query: undefined,
                      page: undefined,
                    },
                  });
                }}
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        )}
      />
    </form>
  );
}
