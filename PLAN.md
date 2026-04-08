# Plan: Type-Safe, Framework-Agnostic TanStack Query Factory

## Context

Developers using TanStack Query must manually track and remember query keys across hooks, mutations, and cache invalidations. A mismatch causes silent bugs (stale cache, failed invalidations). The solution is a factory that co-locates query keys + functions, enforces type safety through TypeScript's phantom type system (`DataTag` from `@tanstack/query-core`), and provides hierarchical `._def` keys for scoped invalidation — without coupling to any framework.

---

## Proposed API

```typescript
const userQueries = createQueryFactory("users", {
  list: (filters?: UserFilters) => ({
    queryFn: () => api.getUsers(filters),
    staleTime: 5000,
  }),
  detail: (id: string) => ({
    queryFn: () => api.getUser(id),
  }),
});

// Returns full queryOptions — works with useQuery, prefetchQuery, fetchQuery
userQueries.detail("123");
// → { queryKey: ['users', 'detail', '123'], queryFn: ..., staleTime: ... }

// Hierarchical invalidation — no need to remember keys
queryClient.invalidateQueries({ queryKey: userQueries._def }); // all users queries
queryClient.invalidateQueries({ queryKey: userQueries.detail._def }); // all detail queries
queryClient.invalidateQueries(userQueries.detail("123")); // specific entry
```

---

## New Package: `packages/query-factory`

Modelled directly after `packages/utils` (same Vite+ toolchain config).

### `packages/query-factory/package.json`

```json
{
  "name": "@tanstack-query-factory/core",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": "./dist/index.mjs",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "@tanstack/query-core": "^5.0.0"
  },
  "devDependencies": {
    "@tanstack/query-core": "^5.0.0",
    "@types/node": "^25.5.0",
    "@typescript/native-preview": "7.0.0-dev.20260328.1",
    "bumpp": "^11.0.1",
    "typescript": "^6.0.2",
    "vite-plus": "^0.1.14"
  },
  "scripts": {
    "build": "vp pack",
    "dev": "vp pack --watch",
    "test": "vp test",
    "check": "vp check",
    "prepublishOnly": "vp run build"
  }
}
```

`@tanstack/query-core` is a `peerDependency` because the factory produces objects consumed by framework-specific adapters (React, Vue, etc.) that already bundle `query-core`. Bundling it twice would break instance equality checks inside TanStack.

### `packages/query-factory/vite.config.ts` — copy verbatim from `packages/utils/vite.config.ts`

### `packages/query-factory/tsconfig.json` — copy verbatim from `packages/utils/tsconfig.json`

---

## Implementation: `packages/query-factory/src/`

### `types.ts` — Full TypeScript surface

```typescript
import type {
  DataTag,
  DefaultError,
  QueryFunction,
  QueryKey,
  QueryOptions,
} from "@tanstack/query-core";

// Phantom-branded key — same mechanism as queryOptions() in @tanstack/react-query.
// QueryClient.getQueryData(key) overloads check specifically for DataTag from query-core,
// which is why we must use it directly rather than defining our own phantom type.
export type FactoryQueryKey<
  TKey extends readonly unknown[],
  TData,
  TError = DefaultError,
> = DataTag<TKey, TData, TError>;

// What a built definition callable returns — compatible with useQuery / fetchQuery / prefetchQuery
export type BuiltQueryOptions<TData, TError, TKey extends QueryKey> = Omit<
  QueryOptions<TData, TError, TData, TKey>,
  "queryKey"
> & {
  queryKey: FactoryQueryKey<TKey, TData, TError>;
  queryFn: QueryFunction<TData, TKey>;
};

// What the user writes per definition (no queryKey — factory controls that)
export type QueryDefinitionOptions<
  TData,
  TArgs extends readonly unknown[],
  TError = DefaultError,
> = Omit<QueryOptions<TData, TError, TData, QueryKey>, "queryKey" | "queryFn"> & {
  queryFn: (...args: TArgs) => TData | Promise<TData>;
};

export type DefinitionsMap = Record<
  string,
  (...args: any[]) => QueryDefinitionOptions<any, any, any>
>;

type InferData<TDef extends (...args: any[]) => QueryDefinitionOptions<any, any, any>> =
  ReturnType<TDef> extends QueryDefinitionOptions<infer TData, any, any> ? TData : never;

// Each definition in the factory map becomes a callable with a ._def
export type BuiltDefinition<
  TNamespace extends string,
  TName extends string,
  TDef extends (...args: any[]) => QueryDefinitionOptions<any, any, any>,
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

// The factory object returned by createQueryFactory
export type QueryFactory<TNamespace extends string, TDefs extends DefinitionsMap> = {
  readonly [K in keyof TDefs]: BuiltDefinition<TNamespace, K & string, TDefs[K]>;
} & {
  readonly _def: FactoryQueryKey<readonly [TNamespace], unknown, DefaultError>;
};
```

**Why `const` generics matter:** `const TNamespace extends string` (TypeScript 5.0+, in use here as 6.0) causes `createQueryFactory('users', ...)` to infer `TNamespace = 'users'` (literal), not `string`. This is what makes `_def` type `readonly ['users']` rather than `readonly [string]`.

### `factory.ts` — Runtime implementation (~40 lines)

```typescript
import type { QueryFactory, DefinitionsMap } from "./types.ts";

export function createQueryFactory<
  const TNamespace extends string,
  const TDefs extends DefinitionsMap,
>(namespace: TNamespace, definitions: TDefs): QueryFactory<TNamespace, TDefs> {
  const built: Record<string, unknown> = {};

  for (const name of Object.keys(definitions)) {
    const userFn = definitions[name]!;

    const callable = (...args: readonly unknown[]) => {
      const userOptions = userFn(...args);
      return {
        ...userOptions,
        queryKey: Object.freeze([namespace, name, ...args]),
        // Wrap to present () => Promise<TData> shape TanStack expects.
        // Args are closed over; QueryFunctionContext is discarded (v1 limitation).
        queryFn: () => userOptions.queryFn(...args),
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
```

The `as any` / `as QueryFactory` casts are localized to the implementation. The entire public API is strongly typed via the overloads in `types.ts`. This is the same pattern used by `queryOptions()` in `@tanstack/react-query` — the source literally reads `export function queryOptions(options: unknown) { return options }`.

### `index.ts` — Public exports

```typescript
export { createQueryFactory } from "./factory.ts";
export type {
  QueryFactory,
  BuiltDefinition,
  BuiltQueryOptions,
  QueryDefinitionOptions,
  FactoryQueryKey,
} from "./types.ts";
```

---

## Tests: `packages/query-factory/tests/factory.test.ts`

Use `import { expect, test, expectTypeOf } from 'vite-plus/test'` (matches `packages/utils` pattern).

| #   | Test case                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `factory._def` deep-equals `['users']`                                                                                             |
| 2   | `factory.detail._def` deep-equals `['users', 'detail']`                                                                            |
| 3   | `factory.detail('123').queryKey` deep-equals `['users', 'detail', '123']`                                                          |
| 4   | Calling `factory.detail('123').queryFn()` invokes user's queryFn with `'123'`                                                      |
| 5   | Options passthrough — `staleTime`, `gcTime` appear on returned object                                                              |
| 6   | No-arg definition: `factory.list().queryKey` deep-equals `['users', 'list']`                                                       |
| 7   | Multi-arg: `factory.posts('u1', 2).queryKey` deep-equals `['users', 'posts', 'u1', 2]`                                             |
| 8   | `QueryClient` round-trip: `fetchQuery` + `getQueryData` returns cached data                                                        |
| 9   | Invalidation: populate two entries, invalidate via `_def`, both marked stale                                                       |
| 10  | `expectTypeOf`: `factory.detail('123').queryKey` assignable to `DataTag<readonly ['users', 'detail', string], User, DefaultError>` |

---

## End-to-End Verification in `apps/website`

1. Add `"@tanstack-query-factory/core": "workspace:*"` and `"@tanstack/query-core": "^5.0.0"` to `apps/website/package.json`
2. Create `apps/website/src/queries.ts` — demonstrate `createQueryFactory` with `QueryClient` (no framework, imperative API only):

```typescript
// apps/website/src/queries.ts
import { QueryClient } from "@tanstack/query-core";
import { createQueryFactory } from "@tanstack-query-factory/core";

interface Post {
  id: number;
  title: string;
}

const postQueries = createQueryFactory("posts", {
  detail: (id: number) => ({
    queryFn: async () => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
      return res.json() as Promise<Post>;
    },
    staleTime: 60_000,
  }),
});

const client = new QueryClient();

// TypeScript must infer: Post | undefined  (proves DataTag branding works)
const cachedPost = client.getQueryData(postQueries.detail(1).queryKey);

await client.prefetchQuery(postQueries.detail(1));
await client.invalidateQueries({ queryKey: postQueries._def }); // all posts
await client.invalidateQueries(postQueries.detail(1)); // specific post
```

3. Run `vp check` inside `apps/website` — if `getQueryData` infers `Post | undefined` rather than `unknown`, the DataTag branding is working correctly.

---

## Implementation Order

1. Scaffold `packages/query-factory/` — `package.json`, `vite.config.ts`, `tsconfig.json`
2. `vp install @tanstack/query-core` inside `packages/query-factory`
3. Write `src/types.ts` → verify with `vp check`
4. Write `src/factory.ts` + `src/index.ts`
5. `vp pack` → verify `dist/index.mjs` and `.d.ts` generated
6. Write `tests/factory.test.ts` → `vp test`
7. Wire `apps/website` (workspace dep + queries.ts demo) → `vp check`
8. Root `vp run ready` — all checks pass across monorepo

---

## Known v1 Limitations

- **`QueryFunctionContext` not exposed**: The `queryFn` wrapper discards the context (no `signal`, `pageParam`, etc.). The user's function receives the original args directly via closure. A v2 design could thread `signal` through a second parameter in the definition callback.
- **No infinite query support**: `queryFn` wrapping assumes a single return value. Infinite queries require a separate `createInfiniteQueryFactory` helper.
