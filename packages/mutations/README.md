# @querykeysmith/mutations

Type-safe mutation factory for [TanStack Query](https://tanstack.com/query) with co-located invalidation.

- **Co-locate** mutation functions with the query keys they invalidate — no more scattered `onSuccess` handlers
- **Factory args** close over into both `mutationFn` and `invalidates`, keeping everything in one place
- **Framework-agnostic** — produces plain `MutationOptions`-compatible objects; works with React, Vue, Solid, or vanilla `@tanstack/query-core`
- **Pairs with `@querykeysmith/core`** — pass `._def` keys and full query options directly into `invalidates`
- **Zero runtime dependencies** beyond `@tanstack/query-core`

## Install

```bash
npm install @querykeysmith/mutations @tanstack/query-core
```

`@tanstack/query-core` is a peer dependency — install whichever v5+ version your project uses.

## Quick Start

```typescript
import { createMutationFactory } from "@querykeysmith/mutations";
import { createQueryFactory } from "@querykeysmith/core";

const userQueries = createQueryFactory("users", {
  list: () => ({ queryFn: () => api.getUsers() }),
  detail: (id: string) => ({ queryFn: () => api.getUser(id) }),
});

const userMutations = createMutationFactory("users", {
  update: (id: string) => ({
    mutationFn: (data: Partial<User>) => api.updateUser(id, data),
    invalidates: [
      userQueries.detail(id), // invalidate this specific entry
      userQueries.list._def, // invalidate all list queries
    ],
  }),

  delete: (id: string) => ({
    mutationFn: (_: void) => api.deleteUser(id),
    invalidates: [userQueries._def], // invalidate the entire namespace
  }),
});
```

### Using with React

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveInvalidateKey } from "@querykeysmith/mutations";

function useUpdateUser(id: string) {
  const client = useQueryClient();
  const { invalidates, ...opts } = userMutations.update(id);

  return useMutation({
    ...opts,
    onSuccess: () =>
      Promise.all(
        invalidates.map((entry) =>
          client.invalidateQueries({ queryKey: resolveInvalidateKey(entry) }),
        ),
      ),
  });
}

// In the component — id is baked into the mutation, not passed as a variable
const { mutate: update } = useUpdateUser(user.id);
update({ name: "Alice" });
```

### Using with Vue

```typescript
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { resolveInvalidateKey } from "@querykeysmith/mutations";

function useUpdateUser(id: string) {
  const client = useQueryClient();
  const { invalidates, ...opts } = userMutations.update(id);

  return useMutation({
    ...opts,
    onSuccess: () =>
      Promise.all(
        invalidates.map((entry) =>
          client.invalidateQueries({ queryKey: resolveInvalidateKey(entry) }),
        ),
      ),
  });
}
```

## API

### `createMutationFactory(namespace, definitions)`

Creates a mutation factory for the given namespace.

| Parameter     | Type                                                                    | Description                                            |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `namespace`   | `string`                                                                | A unique prefix for all mutation keys (e.g. `"users"`) |
| `definitions` | `Record<string, (...factoryArgs) => { mutationFn, invalidates?, ... }>` | A map of named mutation definitions                    |

**Returns** a factory object where:

- `factory.name(...factoryArgs)` — returns `{ mutationKey, mutationFn, invalidates, ...options }` ready for `useMutation`
- `factory.name._def` — returns `[namespace, name]` for mutation-scope filtering
- `factory._def` — returns `[namespace]` for namespace-wide filtering

### Mutation definition shape

Each definition is a function that receives **factory args** (e.g. the entity `id`) which close over into both `mutationFn` and `invalidates`. The returned object includes a required `mutationFn` that accepts **mutation variables** (the actual payload), plus an optional `invalidates` array.

```typescript
{
  update: (id: string) => ({
    //       ↑ factory arg — closes over into mutationFn and invalidates

    mutationFn: (data: Partial<User>) => api.updateUser(id, data),
    //           ↑ mutation variable — passed when calling mutate(data)

    invalidates: [userQueries.detail(id), userQueries.list._def],

    // Any MutationOptions fields also pass through:
    retry: 3,
    gcTime: 5000,
  }),
}
```

**Factory args vs mutation variables:**

| Concept            | What it is                         | Example                       |
| ------------------ | ---------------------------------- | ----------------------------- |
| Factory args       | Passed when calling the definition | `userMutations.update("123")` |
| Mutation variables | Passed when calling `mutate(...)`  | `mutate({ name: "Alice" })`   |

### `resolveInvalidateKey(entry)`

Normalizes an `InvalidatesEntry` to a plain `QueryKey` for use with `queryClient.invalidateQueries`.

```typescript
import { resolveInvalidateKey } from "@querykeysmith/mutations";

// Object form (BuiltQueryOptions from @querykeysmith/core)
resolveInvalidateKey(userQueries.detail("1"));
// → ["users", "detail", "1"]

// Array form (._def key)
resolveInvalidateKey(userQueries.list._def);
// → ["users", "list"]

// Raw array
resolveInvalidateKey(["users"]);
// → ["users"]
```

### `invalidates` array

The `invalidates` field accepts a mix of:

- **Full query options** from `createQueryFactory` — e.g. `userQueries.detail(id)` (has `.queryKey`)
- **`._def` arrays** from a factory or definition — e.g. `userQueries.list._def`, `userQueries._def`
- **Raw `QueryKey` arrays** — e.g. `["users", "list"]`

These are passed to `resolveInvalidateKey` in your framework adapter's `onSuccess` to call `invalidateQueries`.

## Key Structure

Mutation keys follow the same structure as query keys:

| Expression                       | Key                                   |
| -------------------------------- | ------------------------------------- |
| `factory._def`                   | `['users']`                           |
| `factory.update._def`            | `['users', 'update']`                 |
| `factory.update("123")`          | `['users', 'update', '123']`          |
| `factory.bulkUpdate(["1"], tag)` | `['users', 'bulkUpdate', [...], tag]` |

All keys are frozen (immutable) at runtime.

## v1 Limitations

- **`MutationFunctionContext` not threaded** — the context object (with `client`, `meta`, `mutationKey`) is discarded. If you need it, use `useMutation` directly.
- **`invalidates` is eager** — entries are captured when the definition is called (e.g. `userMutations.update("1")`). This is intentional: the same `id` that parameterises the mutation also parameterises the invalidation.
- **No automatic `onSuccess` wiring** — `invalidates` is metadata. A framework adapter (like a future `@keysmith/react`) reads it and calls `resolveInvalidateKey` in `onSuccess`. This keeps the core package framework-agnostic.

## License

MIT
