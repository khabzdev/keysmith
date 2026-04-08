import type { DefaultError, MutationKey, MutationOptions, QueryKey } from "@tanstack/query-core";

// ---------------------------------------------------------------------------
// InvalidatesEntry
// ---------------------------------------------------------------------------

/**
 * An object form of an invalidation target — anything with a queryKey field.
 * Covers BuiltQueryOptions from @querykeysmith/core and plain { queryKey } objects.
 *
 * Structural typing is intentional: @querykeysmith/mutations does NOT import
 * from @querykeysmith/core so it can be used without it.
 */
export type InvalidatesQueryObject = { readonly queryKey: QueryKey };

/**
 * A single entry in the `invalidates` array.
 *
 * Accepts:
 *   - A full query options object: userQueries.detail(id)   → has .queryKey
 *   - A ._def array:              userQueries.list._def     → is QueryKey
 *   - A raw key array:            ['users', 'list']         → is QueryKey
 */
export type InvalidatesEntry = InvalidatesQueryObject | QueryKey;

// ---------------------------------------------------------------------------
// FactoryMutationKey
// ---------------------------------------------------------------------------

/**
 * The mutation key shape produced by createMutationFactory.
 * Mirrors the queryKey pattern: [namespace, name, ...factoryArgs]
 */
export type FactoryMutationKey<
  TNamespace extends string,
  TName extends string,
  TFactoryArgs extends readonly unknown[],
> = readonly [TNamespace, TName, ...TFactoryArgs];

// ---------------------------------------------------------------------------
// Definition input shapes
// ---------------------------------------------------------------------------

/**
 * What the user returns from each definition builder function.
 *
 * mutationFn  — the actual async function that receives mutation variables
 * invalidates — query keys/objects that should be invalidated on success
 *
 * All other MutationOptions fields (retry, gcTime, meta, scope, onMutate,
 * onSuccess, onError, onSettled) may also be included and pass through to output.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MutationDefinitionOptions<TData, TVariables, TError = DefaultError> = Omit<
  MutationOptions<TData, TError, TVariables>,
  "mutationFn" | "mutationKey"
> & {
  mutationFn: (variables: TVariables) => TData | Promise<TData>;
  invalidates?: readonly InvalidatesEntry[];
};

/**
 * The definition builder function the user writes per mutation name.
 *
 * TFactoryArgs — the "factory args" (e.g. id: string) that close over
 *                into mutationFn and invalidates at call time.
 */
export type MutationDefinitionFn<
  TData,
  TFactoryArgs extends readonly unknown[],
  TVariables,
  TError = DefaultError,
> = (...args: TFactoryArgs) => MutationDefinitionOptions<TData, TVariables, TError>;

/**
 * The map of definition names to definition builder functions.
 * Used as the constraint for the TDefs generic on createMutationFactory.
 *
 * Uses `any` here (not `never`/`unknown`) so TypeScript accepts definitions
 * with typed mutationFn parameters. The actual types are captured precisely
 * via `const TDefs extends MutationDefinitionsMap` at the call site.
 */
export type MutationDefinitionsMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => MutationDefinitionOptions<any, any, any>
>;

// ---------------------------------------------------------------------------
// Inference helpers
// ---------------------------------------------------------------------------

// Extract TData directly from the mutationFn return type — more reliable than
// conditional type inference against MutationDefinitionOptions<infer TData, ...>
// because it avoids function parameter contravariance issues.
type InferMutationData<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDef extends (...args: any[]) => { mutationFn: (...args: any[]) => any },
> = Awaited<ReturnType<ReturnType<TDef>["mutationFn"]>>;

// Extract TVariables directly from the first parameter of mutationFn.
type InferMutationVariables<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDef extends (...args: any[]) => { mutationFn: (...args: any[]) => any },
> = Parameters<ReturnType<TDef>["mutationFn"]>[0];

// ---------------------------------------------------------------------------
// Built output shapes
// ---------------------------------------------------------------------------

/**
 * The full options object returned by a built definition callable.
 *
 * Compatible with useMutation and any framework adapter that accepts MutationOptions.
 * `invalidates` is preserved for framework adapters (e.g. @keysmith/react) to wire
 * up automatic cache invalidation on success via resolveInvalidateKey.
 */
export type BuiltMutationOptions<
  TData,
  TVariables,
  TError,
  TNamespace extends string,
  TName extends string,
  TFactoryArgs extends readonly unknown[],
> = Omit<MutationOptions<TData, TError, TVariables>, "mutationFn" | "mutationKey"> & {
  mutationKey: FactoryMutationKey<TNamespace, TName, TFactoryArgs>;
  // Typed as a single-param function (not MutationFunction<TData, TVariables>) because
  // this version's MutationFunction requires a second MutationFunctionContext arg that
  // callers never need. A (variables) => Promise<TData> is structurally assignable to
  // MutationFunction via TypeScript's fewer-params-is-fine rule.
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidates: readonly InvalidatesEntry[];
};

/**
 * Each definition in the factory map becomes a callable that returns
 * BuiltMutationOptions, plus a ._def property for mutation-scope filtering.
 */
export type BuiltMutationDefinition<
  TNamespace extends string,
  TName extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDef extends (...args: any[]) => MutationDefinitionOptions<any, any, any>,
> = {
  (
    ...args: Parameters<TDef>
  ): BuiltMutationOptions<
    InferMutationData<TDef>,
    InferMutationVariables<TDef>,
    DefaultError,
    TNamespace,
    TName,
    Parameters<TDef>
  >;
  /**
   * The definition-level mutation key: [namespace, name]
   * Use with QueryClient.getMutationCache().find({ mutationKey: ... })
   */
  readonly _def: MutationKey & readonly [TNamespace, TName];
};

/**
 * The factory object returned by createMutationFactory.
 *
 * ._def → [namespace]  — scope for all mutations in this factory
 */
export type MutationFactory<TNamespace extends string, TDefs extends MutationDefinitionsMap> = {
  readonly [K in keyof TDefs]: BuiltMutationDefinition<TNamespace, K & string, TDefs[K]>;
} & {
  readonly _def: MutationKey & readonly [TNamespace];
};
