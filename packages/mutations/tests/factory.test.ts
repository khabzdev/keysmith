import { createQueryFactory } from "@querykeysmith/core";
import type { MutationKey } from "@tanstack/query-core";
import { expect, expectTypeOf, test } from "vite-plus/test";
import { createMutationFactory, resolveInvalidateKey } from "../src/index.ts";

// ── Shared fixtures ──────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
}

const userQueries = createQueryFactory("users", {
  list: () => ({
    queryFn: async () => [{ id: "1", name: "Alice" }] as User[],
  }),
  detail: (id: string) => ({
    queryFn: async () => ({ id, name: "Alice" }) as User,
  }),
});

const userMutations = createMutationFactory("users", {
  update: (id: string) => ({
    mutationFn: async (data: Partial<User>) => ({ id, ...data }) as User,
    invalidates: [userQueries.detail(id), userQueries.list._def],
  }),
  delete: (id: string) => ({
    mutationFn: async (_: void) => {
      void id;
    },
    invalidates: [userQueries._def],
  }),
  create: () => ({
    mutationFn: async (data: Omit<User, "id">) => ({ id: "new", ...data }) as User,
    // No invalidates — tests normalization to []
  }),
  bulkUpdate: (ids: string[], _tag: string) => ({
    mutationFn: async (patches: Partial<User>[]) =>
      patches.map((p, i) => ({ id: ids[i] ?? "?", ...p }) as User),
    invalidates: [userQueries._def],
    retry: 3,
    gcTime: 5000,
  }),
});

// ── 1. Namespace _def ────────────────────────────────────────────────────────

test("factory._def equals namespace array", () => {
  expect(userMutations._def).toEqual(["users"]);
});

// ── 2. Definition _def ───────────────────────────────────────────────────────

test("factory.update._def equals [namespace, name]", () => {
  expect(userMutations.update._def).toEqual(["users", "update"]);
});

// ── 3. mutationKey with factory arg ─────────────────────────────────────────

test("mutationKey includes namespace, name, factory arg", () => {
  expect(userMutations.update("123").mutationKey).toEqual(["users", "update", "123"]);
});

// ── 4. No-arg mutationKey ────────────────────────────────────────────────────

test("no-arg definition mutationKey equals [namespace, name]", () => {
  expect(userMutations.create().mutationKey).toEqual(["users", "create"]);
});

// ── 5. Multi-arg mutationKey ─────────────────────────────────────────────────

test("multi-arg definition mutationKey includes all factory args", () => {
  expect(userMutations.bulkUpdate(["1", "2"], "_tag").mutationKey).toEqual([
    "users",
    "bulkUpdate",
    ["1", "2"],
    "_tag",
  ]);
});

// ── 6. mutationFn calls user function ────────────────────────────────────────

test("mutationFn resolves with correct data", async () => {
  const result = await userMutations.update("1").mutationFn({ name: "Bob" });
  expect(result).toEqual({ id: "1", name: "Bob" });
});

// ── 7. mutationFn closes over factory arg ────────────────────────────────────

test("mutationFn closes over factory arg correctly", async () => {
  const result = await userMutations.update("42").mutationFn({});
  expect(result).toMatchObject({ id: "42" });
});

// ── 8. invalidates normalized to [] when absent ──────────────────────────────

test("invalidates is normalized to [] when absent", () => {
  expect(userMutations.create().invalidates).toEqual([]);
});

// ── 9. invalidates: object entry from createQueryFactory ─────────────────────

test("invalidates contains BuiltQueryOptions entry with correct queryKey", () => {
  const { invalidates } = userMutations.update("1");
  const objectEntry = invalidates.find((e) => !Array.isArray(e) && "queryKey" in (e as object)) as
    | { queryKey: unknown }
    | undefined;
  expect(objectEntry?.queryKey).toEqual(["users", "detail", "1"]);
});

// ── 10. invalidates: ._def array entry ───────────────────────────────────────

test("invalidates contains definition ._def array entry", () => {
  const { invalidates } = userMutations.update("1");
  expect(invalidates).toContainEqual(["users", "list"]);
});

// ── 11. invalidates: namespace ._def ─────────────────────────────────────────

test("invalidates contains namespace ._def array", () => {
  expect(userMutations.delete("1").invalidates).toContainEqual(["users"]);
});

// ── 12. Options passthrough ──────────────────────────────────────────────────

test("retry and gcTime pass through from definition", () => {
  const opts = userMutations.bulkUpdate(["1"], "_t");
  expect(opts).toMatchObject({ retry: 3, gcTime: 5000 });
});

// ── 13. _def arrays are frozen ───────────────────────────────────────────────

test("_def arrays are frozen", () => {
  expect(Object.isFrozen(userMutations._def)).toBe(true);
  expect(Object.isFrozen(userMutations.update._def)).toBe(true);
});

// ── 14. mutationKey is frozen ────────────────────────────────────────────────

test("mutationKey is frozen", () => {
  expect(Object.isFrozen(userMutations.update("1").mutationKey)).toBe(true);
});

// ── 15. invalidates array is frozen ─────────────────────────────────────────

test("invalidates array is frozen", () => {
  expect(Object.isFrozen(userMutations.update("1").invalidates)).toBe(true);
});

// ── 16. resolveInvalidateKey: object form ────────────────────────────────────

test("resolveInvalidateKey returns .queryKey from object entry", () => {
  const result = resolveInvalidateKey(userQueries.detail("1"));
  expect(result).toEqual(["users", "detail", "1"]);
});

// ── 17. resolveInvalidateKey: array form ─────────────────────────────────────

test("resolveInvalidateKey returns array as-is for definition ._def", () => {
  const result = resolveInvalidateKey(userQueries.list._def);
  expect(result).toEqual(["users", "list"]);
});

// ── 18. resolveInvalidateKey: namespace ._def ────────────────────────────────

test("resolveInvalidateKey returns namespace ._def as-is", () => {
  const result = resolveInvalidateKey(userQueries._def);
  expect(result).toEqual(["users"]);
});

// ── 19. resolveInvalidateKey: raw array ──────────────────────────────────────

test("resolveInvalidateKey returns raw array as-is", () => {
  const result = resolveInvalidateKey(["posts", "list"]);
  expect(result).toEqual(["posts", "list"]);
});

// ── 20. Closure isolation ────────────────────────────────────────────────────

test("update('1') and update('2') do not share closure state", async () => {
  const result1 = await userMutations.update("1").mutationFn({ name: "Alice" });
  const result2 = await userMutations.update("2").mutationFn({ name: "Bob" });
  expect(result1.id).toBe("1");
  expect(result2.id).toBe("2");
});

// ── 21. Type: mutationFn variables parameter ─────────────────────────────────

test("mutationFn variables parameter is typed correctly", () => {
  expectTypeOf(userMutations.update("1").mutationFn).parameter(0).toEqualTypeOf<Partial<User>>();
});

// ── 22. Type: mutationFn return type ─────────────────────────────────────────

test("mutationFn return type is Promise<TData>", () => {
  expectTypeOf(userMutations.update("1").mutationFn).returns.toEqualTypeOf<Promise<User>>();
});

// ── 23. Type: _def carries literal namespace type ────────────────────────────

test("_def carries the literal namespace type", () => {
  expectTypeOf(userMutations._def).toEqualTypeOf<MutationKey & readonly ["users"]>();
});
