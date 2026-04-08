# Keysmith

Type-safe query key factories for [TanStack Query](https://tanstack.com/query).

## Packages

| Package                                          | Description                                             | npm                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`@querykeysmith/core`](packages/core)           | Framework-agnostic query key factory                    | [![npm](https://img.shields.io/npm/v/@querykeysmith/core)](https://www.npmjs.com/package/@querykeysmith/core)           |
| [`@querykeysmith/mutations`](packages/mutations) | Type-safe mutation factory with co-located invalidation | [![npm](https://img.shields.io/npm/v/@querykeysmith/mutations)](https://www.npmjs.com/package/@querykeysmith/mutations) |

## Quick Start

```bash
npm install @querykeysmith/core @querykeysmith/mutations @tanstack/query-core
```

### Query factory

```typescript
import { createQueryFactory } from "@querykeysmith/core";

const userQueries = createQueryFactory("users", {
  list: (filters?: { role: string }) => ({
    queryFn: () => api.getUsers(filters),
    staleTime: 5000,
  }),
  detail: (id: string) => ({
    queryFn: () => api.getUser(id),
  }),
});

// Full queryOptions — pass to useQuery, fetchQuery, etc.
userQueries.detail("123");
// → { queryKey: ['users', 'detail', '123'], queryFn: ... }

// Hierarchical invalidation
queryClient.invalidateQueries({ queryKey: userQueries._def }); // all users
queryClient.invalidateQueries({ queryKey: userQueries.detail._def }); // all detail
queryClient.invalidateQueries(userQueries.detail("123")); // specific entry

// Type-safe cache reads
const user = queryClient.getQueryData(userQueries.detail("123").queryKey);
//    ^? User | undefined
```

### Mutation factory

```typescript
import { createMutationFactory, resolveInvalidateKey } from "@querykeysmith/mutations";

const userMutations = createMutationFactory("users", {
  update: (id: string) => ({
    mutationFn: (data: Partial<User>) => api.updateUser(id, data),
    invalidates: [
      userQueries.detail(id), // invalidate this specific user
      userQueries.list._def, // invalidate all list queries
    ],
  }),
});

// In a React/Vue composable:
const { invalidates, ...opts } = userMutations.update(user.id);

useMutation({
  ...opts,
  onSuccess: () =>
    Promise.all(
      invalidates.map((entry) =>
        client.invalidateQueries({ queryKey: resolveInvalidateKey(entry) }),
      ),
    ),
});
```

## Development

```bash
# Install dependencies
vp install

# Format, lint, and type-check
vp check

# Run tests
vp run test -r

# Build all packages
vp run build -r

# Run the website demo
vp run website#dev

# Run the Vue demo
vp run vue#dev
```

## Publishing

```bash
cd packages/core        # or packages/mutations
npx bumpp
npm publish --access public
```

> `prepublishOnly` runs `vp run build` automatically.

## License

MIT
