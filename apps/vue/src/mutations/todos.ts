import { createMutationFactory, resolveInvalidateKey } from "@querykeysmith/mutations";
import type { InvalidatesEntry } from "@querykeysmith/mutations";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { storage } from "../lib/storage";
import { todoQueries } from "../queries/todos";
import { useKeysmithBus } from "../composables/useKeysmithBus";
import type { Priority, Todo } from "../types";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const todoMutations = createMutationFactory("todos", {
  create: () => ({
    mutationFn: ({ title, priority }: { title: string; priority: Priority }) =>
      Promise.resolve(storage.create(title, priority)),
    invalidates: [todoQueries._def],
  }),

  toggle: (id: string) => ({
    mutationFn: (_: void) => Promise.resolve(storage.toggle(id)),
    invalidates: [todoQueries._def, todoQueries.detail(id)],
  }),

  update: (id: string) => ({
    mutationFn: ({ title, priority }: { title: string; priority: Priority }) =>
      Promise.resolve(storage.update(id, { title, priority })),
    invalidates: [todoQueries.list._def, todoQueries.detail(id)],
  }),

  delete: (id: string) => ({
    mutationFn: (_: void) => {
      storage.remove(id);
      return Promise.resolve();
    },
    invalidates: [todoQueries._def],
  }),

  clearCompleted: () => ({
    mutationFn: (_: void) => {
      storage.clearCompleted();
      return Promise.resolve();
    },
    invalidates: [todoQueries._def],
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
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
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
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
      bus.emit(
        "instance",
        todoQueries.detail(todo.id).queryKey,
        `todoQueries.detail('${todo.id}')`,
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
      bus.emit("definition", todoQueries.list._def, "todoQueries.list._def");
      bus.emit(
        "instance",
        todoQueries.detail(todo.id).queryKey,
        `todoQueries.detail('${todo.id}')`,
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
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
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
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
      await invalidateAll(invalidates, client);
    },
  });
}
