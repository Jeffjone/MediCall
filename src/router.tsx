import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { retryRead } from "./lib/app-errors";

export const getRouter = () => {
  const queryClient = new QueryClient({ defaultOptions: {
    queries: { retry: retryRead, retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000) },
    mutations: { retry: false },
  } });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
