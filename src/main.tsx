import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthError, HttpError, RpcError } from "@/api";
import { ModalProvider } from "./components/modal";
import { toast } from "./toast";

// Create a new router instance
const router = createRouter({ routeTree, basepath: window.porla.base_path });

declare module "@tanstack/react-query" {
  interface Register {
    // silent: the component shows this error itself, so don't toast it
    queryMeta: { silent?: boolean };
    mutationMeta: { silent?: boolean };
  }
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Every query and mutation error ends up here: a lost session goes to the
// login page, anything else is shown as a toast.
function onError(error: Error, meta?: { silent?: boolean }) {
  if (error instanceof AuthError) {
    if (router.state.location.pathname !== "/login") {
      router.navigate({
        to: "/login",
        search: { redirect: router.state.location.href },
      });
    }
    return;
  }

  if (!meta?.silent) {
    toast(error.message || "Request failed");
  }
}

// Errors that would fail the same way again aren't retried.
function retry(failureCount: number, error: Error) {
  if (error instanceof AuthError || error instanceof RpcError) return false;
  if (error instanceof HttpError && error.status < 500) return false;
  return failureCount < 3;
}

// Render the app
const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onError(error, query.meta),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) =>
        onError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        retry,
      },
    },
  });

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ModalProvider>
          <RouterProvider router={router} />
        </ModalProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
