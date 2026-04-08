import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { storage } from "../lib/storage";
import { todoQueries } from "../queries/todos";
import { useKeysmithBus } from "../composables/useKeysmithBus";
import type { Priority } from "../types";

export function useCreateTodo() {
  const client = useQueryClient();
  const bus = useKeysmithBus();

  return useMutation({
    mutationFn: ({ title, priority }: { title: string; priority: Priority }) =>
      Promise.resolve(storage.create(title, priority)),
    onSuccess: async () => {
      // Namespace invalidation — affects list, byStatus, stats
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
      await client.invalidateQueries({ queryKey: todoQueries._def });
    },
  });
}

export function useToggleTodo() {
  const client = useQueryClient();
  const bus = useKeysmithBus();

  return useMutation({
    mutationFn: (id: string) => Promise.resolve(storage.toggle(id)),
    onSuccess: async (todo) => {
      // Namespace invalidation — toggle affects list, detail, byStatus, stats
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
      await client.invalidateQueries({ queryKey: todoQueries._def });
      // Also warm the specific detail cache
      bus.emit(
        "instance",
        todoQueries.detail(todo.id).queryKey,
        `todoQueries.detail('${todo.id}')`,
      );
    },
  });
}

export function useUpdateTodo() {
  const client = useQueryClient();
  const bus = useKeysmithBus();

  return useMutation({
    mutationFn: ({ id, title, priority }: { id: string; title: string; priority: Priority }) =>
      Promise.resolve(storage.update(id, { title, priority })),
    onSuccess: async (todo) => {
      // Definition-level — only list and the specific detail need updating
      bus.emit("definition", todoQueries.list._def, "todoQueries.list._def");
      bus.emit(
        "instance",
        todoQueries.detail(todo.id).queryKey,
        `todoQueries.detail('${todo.id}')`,
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: todoQueries.list._def }),
        client.invalidateQueries({ queryKey: todoQueries.detail(todo.id).queryKey }),
      ]);
    },
  });
}

export function useDeleteTodo() {
  const client = useQueryClient();
  const bus = useKeysmithBus();

  return useMutation({
    mutationFn: (id: string) => {
      storage.remove(id);
      return Promise.resolve();
    },
    onSuccess: async () => {
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
      await client.invalidateQueries({ queryKey: todoQueries._def });
    },
  });
}

export function useClearCompleted() {
  const client = useQueryClient();
  const bus = useKeysmithBus();

  return useMutation({
    mutationFn: () => {
      storage.clearCompleted();
      return Promise.resolve();
    },
    onSuccess: async () => {
      bus.emit("namespace", todoQueries._def, "todoQueries._def");
      await client.invalidateQueries({ queryKey: todoQueries._def });
    },
  });
}
