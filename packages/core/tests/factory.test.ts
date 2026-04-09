import { QueryClient } from "@tanstack/query-core";
import { expect, expectTypeOf, test } from "vite-plus/test";
import { createQueryFactory, mergeQueryFactories } from "../src/index.ts";

// ── Shared fixture ──────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
}

interface Post {
  id: number;
  title: string;
}

const userQueries = createQueryFactory("users", {
  list: () => ({
    queryFn: async () => [{ id: "1", name: "Alice" }] as User[],
    staleTime: 5000,
  }),
  detail: (id: string) => ({
    queryFn: async () => ({ id, name: "Alice" }) as User,
    gcTime: 10000,
  }),
  posts: (userId: string, page: number) => ({
    queryFn: async () => [{ id: page, title: `Post by ${userId}` }] as Post[],
  }),
});

// ── 1. Namespace _def ───────────────────────────────────────────────────────

test("factory._def equals namespace array", () => {
  expect(userQueries._def).toEqual(["users"]);
});

// ── 2. Definition _def ──────────────────────────────────────────────────────

test("factory.detail._def equals [namespace, name]", () => {
  expect(userQueries.detail._def).toEqual(["users", "detail"]);
});

test("factory.list._def equals [namespace, name]", () => {
  expect(userQueries.list._def).toEqual(["users", "list"]);
});

// ── 3. Key shape with args ───────────────────────────────────────────────────

test("factory.detail('123').queryKey equals [namespace, name, arg]", () => {
  expect(userQueries.detail("123").queryKey).toEqual(["users", "detail", "123"]);
});

// ── 4. No-arg definition key shape ──────────────────────────────────────────

test("factory.list().queryKey equals [namespace, name] for no-arg definitions", () => {
  expect(userQueries.list().queryKey).toEqual(["users", "list"]);
});

// ── 5. Multi-arg definition key shape ───────────────────────────────────────

test("factory.posts() queryKey includes all args", () => {
  expect(userQueries.posts("u1", 2).queryKey).toEqual(["users", "posts", "u1", 2]);
});

// ── 6. queryFn invokes user-provided function with correct args ──────────────

test("factory.detail queryFn resolves with correct data", async () => {
  const result = await userQueries.detail("42").queryFn();
  expect(result).toEqual({ id: "42", name: "Alice" });
});

test("factory.posts queryFn resolves with correct data", async () => {
  const result = await userQueries.posts("u1", 3).queryFn();
  expect(result).toEqual([{ id: 3, title: "Post by u1" }]);
});

// ── 7. Options passthrough ───────────────────────────────────────────────────

test("staleTime is passed through from definition", () => {
  expect(userQueries.list()).toMatchObject({ staleTime: 5000 });
});

test("gcTime is passed through from definition", () => {
  expect(userQueries.detail("1")).toMatchObject({ gcTime: 10000 });
});

// ── 8. QueryClient round-trip ────────────────────────────────────────────────

test("fetchQuery + getQueryData round-trip via QueryClient", async () => {
  const client = new QueryClient();
  await client.fetchQuery(userQueries.detail("99"));
  const cached = client.getQueryData(userQueries.detail("99").queryKey);
  expect(cached).toEqual({ id: "99", name: "Alice" });
  client.clear();
});

// ── 9. Invalidation marks matching entries stale ─────────────────────────────

test("invalidating via _def marks all namespace queries stale", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  await client.fetchQuery(userQueries.detail("1"));
  await client.fetchQuery(userQueries.detail("2"));
  await client.fetchQuery(userQueries.list());

  await client.invalidateQueries({ queryKey: userQueries._def });

  expect(client.getQueryState(userQueries.detail("1").queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(userQueries.detail("2").queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(userQueries.list().queryKey)?.isInvalidated).toBe(true);
  client.clear();
});

test("invalidating via definition _def only marks that definition stale", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  await client.fetchQuery(userQueries.detail("1"));
  await client.fetchQuery(userQueries.list());

  await client.invalidateQueries({ queryKey: userQueries.detail._def });

  expect(client.getQueryState(userQueries.detail("1").queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(userQueries.list().queryKey)?.isInvalidated).toBe(false);
  client.clear();
});

// ── 10. Type-level assertions ─────────────────────────────────────────────────

test("queryKey type carries data type brand (DataTag)", () => {
  // If DataTag branding works, getQueryData infers User | undefined, not unknown
  const client = new QueryClient();
  const key = userQueries.detail("1").queryKey;
  const data = client.getQueryData(key);
  expectTypeOf(data).toEqualTypeOf<User | undefined>();
});

test("list queryKey carries User[] brand", () => {
  const client = new QueryClient();
  const data = client.getQueryData(userQueries.list().queryKey);
  expectTypeOf(data).toEqualTypeOf<User[] | undefined>();
});

test("_def is frozen (immutable)", () => {
  expect(Object.isFrozen(userQueries._def)).toBe(true);
  expect(Object.isFrozen(userQueries.detail._def)).toBe(true);
  expect(Object.isFrozen(userQueries.detail("1").queryKey)).toBe(true);
});

// ── 11. mergeQueryFactories ───────────────────────────────────────────────────

const postQueries = createQueryFactory("posts", {
  list: () => ({
    queryFn: async () => [{ id: 1, title: "Hello" }],
  }),
});

const merged = mergeQueryFactories({ users: userQueries, posts: postQueries });

test("mergeQueryFactories: key structure of first factory unchanged", () => {
  expect(merged.users.detail("1").queryKey).toEqual(["users", "detail", "1"]);
});

test("mergeQueryFactories: _def of first factory unchanged", () => {
  expect(merged.users._def).toEqual(["users"]);
});

test("mergeQueryFactories: key structure of second factory unchanged", () => {
  expect(merged.posts.list().queryKey).toEqual(["posts", "list"]);
});

test("mergeQueryFactories: returns same object references (identity)", () => {
  expect(merged.users).toBe(userQueries);
  expect(merged.posts).toBe(postQueries);
});

test("mergeQueryFactories: type — merged factory preserves source type", () => {
  expectTypeOf(merged.users).toEqualTypeOf<typeof userQueries>();
});
