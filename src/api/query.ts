import {
  useMutation,
  useQuery,
  type DefinedInitialDataOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { jsonrpc } from "./client";
import type { Method, NoParams, Params, Result } from "./methods";

type QueryConfig<M extends Method> = Partial<
  DefinedInitialDataOptions<Result<M>, Error, Result<M>, readonly unknown[]>
>;

// Methods whose params are all optional can be called without them.
type RpcArgs<M extends Method> =
  NoParams extends Params<M>
    ? [params?: Params<M> | null, config?: QueryConfig<M>]
    : [params: Params<M>, config?: QueryConfig<M>];

export function useInvoker<M extends Method>(
  method: M,
  options?: Partial<UseMutationOptions<Result<M>, Error, Params<M>, unknown>>,
) {
  return useMutation({
    mutationFn: (params: Params<M>) => jsonrpc(method, params),
    mutationKey: [method],
    networkMode: "always",
    ...options,
  });
}

export function useRPC<M extends Method>(method: M, ...args: RpcArgs<M>) {
  const [params, config] = args;
  return useQuery<Result<M>>({
    queryFn: ({ signal }) => jsonrpc(method, params, signal),
    queryKey: [method, params],
    ...config,
  });
}
