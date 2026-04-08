# Keysmith Roadmap

## Released

### `@querykeysmith/core`

Type-safe, framework-agnostic TanStack Query key factory. Co-locates query keys and query functions, provides hierarchical `._def` keys for scoped cache invalidation, and uses `DataTag` from `@tanstack/query-core` for full type inference through `QueryClient`.

---

## Planned

### `@keysmith/mutations`

**Priority: High**

Completes the loop — fetch, mutate, and invalidate are all type-safe with zero manual key management. Co-locates the mutation function with the query keys it should invalidate on success.

```typescript
const userMutations = createMutationFactory("users", {
  update: (id: string) => ({
    mutationFn: (data: Partial<User>) => api.updateUser(id, data),
    invalidates: [userQueries.detail(id), userQueries.list._def],
  }),
});
```

---

### `@keysmith/react`

**Priority: High**

Thin React adapter. Wraps `useQuery`, `useMutation`, and `useSuspenseQuery` with factory-typed inputs so components get full inference without boilerplate.

```typescript
const { data } = useKeyQuery(userQueries.detail("123"));
// data infers as User | undefined — no generic needed
```

---

### `@keysmith/infinite`

**Priority: Medium**

First-class support for infinite/paginated queries. Separate factory since infinite queries have a fundamentally different shape (`pageParam`, `getNextPageParam`, `fetchInfiniteQuery`).

```typescript
const postQueries = createInfiniteQueryFactory("posts", {
  feed: (filters: Filters) => ({
    queryFn: ({ pageParam }) => api.getPosts(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor,
  }),
});
```

---

### `@keysmith/testing`

**Priority: Medium**

Test utilities for mocking factory queries in unit tests without spinning up a real `QueryClient`. Makes it easy to stub responses at the factory level.

```typescript
mockQuery(userQueries.detail("1"), { id: "1", name: "Alice" });
mockQuery(userQueries.list(), [{ id: "1", name: "Alice" }]);
```

---

### `@keysmith/devtools`

**Priority: Low**

Factory-aware devtools panel. Wraps TanStack's existing devtools and groups cached entries by factory namespace and definition, making it easier to inspect and invalidate queries by their logical structure rather than raw key arrays.
