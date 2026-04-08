import type { DefinitionsMap, QueryFactory } from "./types.ts";

/**
 * Creates a type-safe, framework-agnostic query factory for a given namespace.
 *
 * Each definition produces a callable that returns full queryOptions-compatible
 * objects (queryKey + queryFn + any extra options). Both the factory and each
 * definition expose a ._def key for hierarchical cache invalidation.
 *
 * @example
 * const userQueries = createQueryFactory('users', {
 *   detail: (id: string) => ({ queryFn: () => api.getUser(id) }),
 *   list: (filters?: Filters) => ({ queryFn: () => api.getUsers(filters) }),
 * })
 *
 * // Full options — pass to useQuery, fetchQuery, prefetchQuery, etc.
 * userQueries.detail('123')
 * // → { queryKey: ['users', 'detail', '123'], queryFn: ... }
 *
 * // Hierarchical invalidation — no need to remember keys
 * queryClient.invalidateQueries({ queryKey: userQueries._def })         // all users
 * queryClient.invalidateQueries({ queryKey: userQueries.detail._def })  // all detail
 * queryClient.invalidateQueries(userQueries.detail('123'))              // specific entry
 */
export function createQueryFactory<
  const TNamespace extends string,
  const TDefs extends DefinitionsMap,
>(namespace: TNamespace, definitions: TDefs): QueryFactory<TNamespace, TDefs> {
  const built: Record<string, unknown> = {};

  for (const name of Object.keys(definitions)) {
    const userFn = definitions[name]!;

    const callable = (...args: readonly unknown[]) => {
      const userOptions = userFn(...(args as never[]));
      return {
        ...userOptions,
        queryKey: Object.freeze([namespace, name, ...args]),
        // Wrap queryFn: args are closed over; QueryFunctionContext is discarded.
        // v1 limitation: no access to signal/pageParam from context.
        queryFn: () => userOptions.queryFn(...(args as never[])),
      };
    };

    Object.defineProperty(callable, "_def", {
      value: Object.freeze([namespace, name]),
      writable: false,
      enumerable: true,
      configurable: false,
    });

    built[name] = callable;
  }

  Object.defineProperty(built, "_def", {
    value: Object.freeze([namespace]),
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return built as QueryFactory<TNamespace, TDefs>;
}
