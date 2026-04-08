# Keysmith

Type-safe query key factories for [TanStack Query](https://tanstack.com/query).

## Packages

| Package                                | Description                          | npm                                                                                                           |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [`@querykeysmith/core`](packages/core) | Framework-agnostic query key factory | [![npm](https://img.shields.io/npm/v/@querykeysmith/core)](https://www.npmjs.com/package/@querykeysmith/core) |

## Quick Start

```bash
npm install @querykeysmith/core @tanstack/query-core
```

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
cd packages/core
npx bumpp
npm publish --access public
```

> `prepublishOnly` runs `vp run build` automatically.

## License

MIT
