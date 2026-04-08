import type { QueryKey } from "@tanstack/query-core";
import type { InvalidatesEntry, MutationDefinitionsMap, MutationFactory } from "./types.ts";

/**
 * Resolves an InvalidatesEntry to a plain QueryKey for use with
 * QueryClient.invalidateQueries({ queryKey: ... }).
 *
 * Accepts:
 *   - { queryKey: QueryKey }  — BuiltQueryOptions or any object with queryKey
 *   - QueryKey                — ._def arrays, raw arrays
 */
export function resolveInvalidateKey(entry: InvalidatesEntry): QueryKey {
  if (!Array.isArray(entry) && typeof entry === "object" && entry !== null && "queryKey" in entry) {
    return (entry as { readonly queryKey: QueryKey }).queryKey;
  }
  return entry as QueryKey;
}

/**
 * Creates a type-safe, framework-agnostic mutation factory for a given namespace.
 *
 * Each definition receives "factory args" (e.g. id: string) that close over into
 * mutationFn and invalidates. The actual mutation payload ("variables") is accepted
 * by mutationFn at call time.
 *
 * The built options are compatible with useMutation, QueryClient.executeMutation,
 * and any adapter that accepts MutationOptions. Framework adapters read .invalidates
 * and call resolveInvalidateKey on each entry to wire up cache invalidation on success.
 *
 * @example
 * const userMutations = createMutationFactory("users", {
 *   update: (id: string) => ({
 *     mutationFn: (data: Partial<User>) => api.updateUser(id, data),
 *     invalidates: [userQueries.detail(id), userQueries.list._def],
 *   }),
 * });
 *
 * // Produces full mutation options
 * userMutations.update("123")
 * // → { mutationKey: ['users', 'update', '123'], mutationFn, invalidates }
 *
 * // Definition-level key: ['users', 'update']
 * userMutations.update._def
 *
 * // Namespace-level key: ['users']
 * userMutations._def
 */
export function createMutationFactory<
  const TNamespace extends string,
  const TDefs extends MutationDefinitionsMap,
>(namespace: TNamespace, definitions: TDefs): MutationFactory<TNamespace, TDefs> {
  const built: Record<string, unknown> = {};

  for (const name of Object.keys(definitions)) {
    const userFn = definitions[name]!;

    const callable = (...args: readonly unknown[]) => {
      const { mutationFn: userMutationFn, invalidates, ...rest } = userFn(...(args as never[]));

      return {
        ...rest,
        mutationKey: Object.freeze([namespace, name, ...args]),
        // Wrap user's (variables) => TData | Promise<TData> to satisfy MutationFunction.
        // MutationFunctionContext is discarded at v1 — consistent with @querykeysmith/core's
        // queryFn wrapping which also discards QueryFunctionContext.
        mutationFn: (variables: unknown) => Promise.resolve(userMutationFn(variables as never)),
        // Normalize: always a frozen array, never undefined
        invalidates: Object.freeze(invalidates ?? []),
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

  return built as MutationFactory<TNamespace, TDefs>;
}
