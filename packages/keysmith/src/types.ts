import type { DataTag, DefaultError, QueryKey, QueryOptions } from "@tanstack/query-core";

/**
 * A phantom-branded query key that carries TData and TError at the type level.
 * Uses DataTag from @tanstack/query-core directly — this is what makes
 * QueryClient.getQueryData(key) infer the correct data type rather than unknown.
 */
export type FactoryQueryKey<
  TKey extends readonly unknown[],
  TData,
  TError = DefaultError,
> = DataTag<TKey, TData, TError>;

/**
 * The full options object returned by a built definition callable.
 * Compatible with useQuery, fetchQuery, prefetchQuery, getQueryData, etc.
 */
/**
 * queryFn is typed as () => Promise<TData> (zero-arg) rather than QueryFunction<TData, TKey>
 * for two reasons:
 * 1. Args are closed over in the factory — no QueryFunctionContext needed
 * 2. () => Promise<TData> is assignable to QueryFunction<TData, TKey, any> because TypeScript
 *    allows functions with fewer parameters to satisfy function types with more parameters.
 *    This avoids a TPageParam contravariance error when passing to fetchQuery/prefetchQuery.
 */
export type BuiltQueryOptions<TData, TError, TKey extends QueryKey> = Omit<
  QueryOptions<TData, TError, TData, TKey>,
  "queryKey" | "queryFn"
> & {
  queryKey: FactoryQueryKey<TKey, TData, TError>;
  queryFn: () => Promise<TData>;
};

/**
 * What the user writes per definition — any QueryOptions fields except queryKey
 * (controlled by the factory) and queryFn (provided separately for args injection).
 */
export type QueryDefinitionOptions<
  TData,
  TArgs extends readonly unknown[],
  TError = DefaultError,
> = Omit<QueryOptions<TData, TError, TData, QueryKey>, "queryKey" | "queryFn"> & {
  queryFn: (...args: TArgs) => TData | Promise<TData>;
};

export type DefinitionsMap = Record<
  string,
  (...args: never[]) => QueryDefinitionOptions<unknown, never[], DefaultError>
>;

type InferData<
  TDef extends (...args: never[]) => QueryDefinitionOptions<unknown, never[], DefaultError>,
> =
  ReturnType<TDef> extends QueryDefinitionOptions<infer TData, never[], DefaultError>
    ? TData
    : never;

/**
 * Each definition in the factory map becomes a callable with a ._def prefix key.
 *
 * ._def → ['namespace', 'name']  — use with invalidateQueries for all instances
 * callable(...args) → full queryOptions — use with useQuery, fetchQuery, etc.
 */
export type BuiltDefinition<
  TNamespace extends string,
  TName extends string,
  TDef extends (...args: never[]) => QueryDefinitionOptions<unknown, never[], DefaultError>,
> = {
  (
    ...args: Parameters<TDef>
  ): BuiltQueryOptions<
    InferData<TDef>,
    DefaultError,
    readonly [TNamespace, TName, ...Parameters<TDef>]
  >;
  readonly _def: FactoryQueryKey<readonly [TNamespace, TName], InferData<TDef>, DefaultError>;
};

/**
 * The factory object returned by createQueryFactory.
 *
 * ._def → ['namespace']  — use with invalidateQueries for all queries in namespace
 */
export type QueryFactory<TNamespace extends string, TDefs extends DefinitionsMap> = {
  readonly [K in keyof TDefs]: BuiltDefinition<TNamespace, K & string, TDefs[K]>;
} & {
  readonly _def: FactoryQueryKey<readonly [TNamespace], unknown, DefaultError>;
};
