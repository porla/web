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
import {
  AuthError,
  HttpError,
  RpcError,
  infoHashKey,
  type InfoHash,
} from "@/api";
import { ModalProvider } from "@/components/modal/modal-provider";
import { toast } from "@/lib/toast";

// Create a new router instance
const router = createRouter({ routeTree, basepath: window.porla.base_path });

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { errorToast?: boolean };
    mutationMeta: { errorToast?: boolean };
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
function onError(error: Error, meta?: { errorToast?: boolean }) {
  if (error instanceof AuthError) {
    if (router.state.location.pathname !== "/login") {
      void router.navigate({
        to: "/login",
        search: { redirect: router.state.location.href },
      });
    }
    return;
  }

  if (meta?.errorToast !== false) {
    toast(error.message || "Request failed");
  }
}

// Skips the queries of a torrent that left (removed, migrated): they'd fail,
// and the details panel would close with "Torrent not found".
function refreshTorrents(
  client: QueryClient,
  method: unknown,
  params: unknown,
): Promise<void> | undefined {
  if (typeof method !== "string" || !method.startsWith("torrents.")) return;

  const torrent = (p: unknown) => {
    const hash = (p as { info_hash?: InfoHash } | null)?.info_hash;
    return hash && infoHashKey(hash);
  };

  const left =
    method === "torrents.remove" || method === "torrents.migrate"
      ? torrent(params)
      : undefined;

  return client.invalidateQueries({
    predicate: ({ queryKey: [m, p] }) =>
      String(m).startsWith("torrents.") && (!left || torrent(p) !== left),
  });
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

  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onError(error, query.meta),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) =>
        onError(error, mutation.meta),
      onSuccess: (_data, variables, _result, mutation) =>
        refreshTorrents(
          queryClient,
          mutation.options.mutationKey?.[0],
          variables,
        ),
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
