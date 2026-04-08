# @querykeysmith/core

Type-safe, framework-agnostic query key factory for [TanStack Query](https://tanstack.com/query).

- **Co-locate** query keys and query functions in a single factory — no more scattered string keys
- **Hierarchical invalidation** via `._def` keys at namespace and definition levels
- **Full type inference** — `QueryClient.getQueryData(key)` returns the correct type, not `unknown`
- **Framework-agnostic** — works with React, Vue, Solid, Angular, or vanilla `@tanstack/query-core`
- **Zero runtime dependencies** beyond `@tanstack/query-core`

## Install

```bash
npm install @querykeysmith/core @tanstack/query-core
```

`@tanstack/query-core` is a peer dependency — install whichever v5+ version your project uses.

## Quick Start

```typescript
import { createQueryFactory } from "@querykeysmith/core";

const userQueries = createQueryFactory("users", {
  list: (filters?: { role: string }) => ({
    queryFn: () => fetch("/api/users").then((r) => r.json()) as Promise<User[]>,
    staleTime: 5000,
  }),
  detail: (id: string) => ({
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) as Promise<User>,
  }),
});
```

### Using with queries

Each definition returns a full `queryOptions`-compatible object (queryKey + queryFn + any extra options), so you can pass it directly to `useQuery`, `fetchQuery`, `prefetchQuery`, etc.

```typescript
// React
const { data } = useQuery(userQueries.detail("123"));

// Vue
const { data } = useQuery(userQueries.list());

// Vanilla
const data = await queryClient.fetchQuery(userQueries.detail("123"));
```

### Hierarchical invalidation

Every factory and definition exposes a `._def` key for scoped cache invalidation:

```typescript
// Invalidate ALL user queries (list + detail + ...)
queryClient.invalidateQueries({ queryKey: userQueries._def });

// Invalidate all "detail" queries
queryClient.invalidateQueries({ queryKey: userQueries.detail._def });

// Invalidate a specific entry
queryClient.invalidateQueries(userQueries.detail("123"));
```

### Type-safe cache reads

Query keys are branded with `DataTag` from `@tanstack/query-core`, so `getQueryData` infers the correct return type:

```typescript
const user = queryClient.getQueryData(userQueries.detail("123").queryKey);
//    ^? User | undefined  (not unknown)
```

## API

### `createQueryFactory(namespace, definitions)`

Creates a query factory for the given namespace.

| Parameter     | Type                                                   | Description                                         |
| ------------- | ------------------------------------------------------ | --------------------------------------------------- |
| `namespace`   | `string`                                               | A unique prefix for all query keys (e.g. `"users"`) |
| `definitions` | `Record<string, (...args) => { queryFn, ...options }>` | A map of named query definitions                    |

**Returns** a factory object where:

- `factory.name(...args)` — returns `{ queryKey, queryFn, ...options }` ready for `useQuery` / `fetchQuery`
- `factory.name._def` — returns `[namespace, name]` for scoped invalidation
- `factory._def` — returns `[namespace]` for namespace-wide invalidation

### Query definition shape

Each definition is a function that receives your custom arguments and returns an object with at least a `queryFn`. Any additional [QueryOptions](https://tanstack.com/query/latest/docs/reference/QueryOptions) fields (`staleTime`, `gcTime`, `retry`, etc.) are passed through.

```typescript
{
  detail: (id: string) => ({
    queryFn: () => api.getUser(id),
    staleTime: 10_000,
    gcTime: 30_000,
  }),
}
```

## Key Structure

Keys are structured arrays built from the namespace, definition name, and arguments:

| Expression               | Key                           |
| ------------------------ | ----------------------------- |
| `factory._def`           | `['users']`                   |
| `factory.list._def`      | `['users', 'list']`           |
| `factory.list()`         | `['users', 'list']`           |
| `factory.detail._def`    | `['users', 'detail']`         |
| `factory.detail('123')`  | `['users', 'detail', '123']`  |
| `factory.posts('u1', 2)` | `['users', 'posts', 'u1', 2]` |

All keys are frozen (immutable) at runtime.

## License

MIT
