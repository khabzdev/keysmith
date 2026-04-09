import { createMutationFactory, resolveInvalidateKey } from "@querykeysmith/mutations";
import type { InvalidatesEntry } from "@querykeysmith/mutations";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { storage } from "../lib/storage";
import { queries } from "../queries/index";
import { useKeysmithBus } from "../composables/useKeysmithBus";
import type { Priority, Todo } from "../types";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const todoMutations = createMutationFactory("todos", {
  create: () => ({
    mutationFn: ({ title, priority }: { title: string; priority: Priority }) =>
      Promise.resolve(storage.create(title, priority)),
    invalidates: [queries.todos._def],
  }),

  toggle: (id: string) => ({
    mutationFn: (_: void) => Promise.resolve(storage.toggle(id)),
    invalidates: [queries.todos._def, queries.todos.detail(id)],
  }),

  update: (id: string) => ({
    mutationFn: ({ title, priority }: { title: string; priority: Priority }) =>
      Promise.resolve(storage.update(id, { title, priority })),
    invalidates: [queries.todos.list._def, queries.todos.detail(id)],
  }),

  delete: (id: string) => ({
    mutationFn: (_: void) => {
      storage.remove(id);
      return Promise.resolve();
    },
    invalidates: [queries.todos._def],
  }),

  clearCompleted: () => ({
    mutationFn: (_: void) => {
      storage.clearCompleted();
      return Promise.resolve();
    },
    invalidates: [queries.todos._def],
  }),
});

// ---------------------------------------------------------------------------
// Composables
// ---------------------------------------------------------------------------

function invalidateAll(
  invalidates: readonly InvalidatesEntry[],
  client: ReturnType<typeof useQueryClient>,
) {
  return Promise.all(
    invalidates.map((entry: InvalidatesEntry) =>
      client.invalidateQueries({ queryKey: resolveInvalidateKey(entry) }),
    ),
  );
}

export function useCreateTodo() {
  const client = useQueryClient();
  const bus = useKeysmithBus();
  const { invalidates, ...opts } = todoMutations.create();

  return useMutation({
    ...opts,
    onSuccess: async () => {
      bus.emit("namespace", queries.todos._def, "queries.todos._def");
      await invalidateAll(invalidates, client);
    },
  });
}

export function useToggleTodo(id: string) {
  const client = useQueryClient();
  const bus = useKeysmithBus();
  const { invalidates, ...opts } = todoMutations.toggle(id);

  return useMutation({
    ...opts,
    onSuccess: async (todo: Todo) => {
      bus.emit("namespace", queries.todos._def, "queries.todos._def");
      bus.emit(
        "instance",
        queries.todos.detail(todo.id).queryKey,
        `queries.todos.detail('${todo.id}')`,
      );
      await invalidateAll(invalidates, client);
    },
  });
}

export function useUpdateTodo(id: string) {
  const client = useQueryClient();
  const bus = useKeysmithBus();
  const { invalidates, ...opts } = todoMutations.update(id);

  return useMutation({
    ...opts,
    onSuccess: async (todo: Todo) => {
      bus.emit("definition", queries.todos.list._def, "queries.todos.list._def");
      bus.emit(
        "instance",
        queries.todos.detail(todo.id).queryKey,
        `queries.todos.detail('${todo.id}')`,
      );
      await invalidateAll(invalidates, client);
    },
  });
}

export function useDeleteTodo(id: string) {
  const client = useQueryClient();
  const bus = useKeysmithBus();
  const { invalidates, ...opts } = todoMutations.delete(id);

  return useMutation({
    ...opts,
    onSuccess: async () => {
      bus.emit("namespace", queries.todos._def, "queries.todos._def");
      await invalidateAll(invalidates, client);
    },
  });
}

export function useClearCompleted() {
  const client = useQueryClient();
  const bus = useKeysmithBus();
  const { invalidates, ...opts } = todoMutations.clearCompleted();

  return useMutation({
    ...opts,
    onSuccess: async () => {
      bus.emit("namespace", queries.todos._def, "queries.todos._def");
      await invalidateAll(invalidates, client);
    },
  });
}
