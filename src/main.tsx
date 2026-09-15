import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthError } from "@/api";
import { ModalProvider } from "./components/modal";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry(failureCount, error) {
          if (error instanceof AuthError) {
            router.navigate({ to: "/login" });
            return false;
          }

          return failureCount < 3;
        },
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
