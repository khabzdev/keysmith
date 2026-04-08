import type { Priority, Todo, TodoStats } from "../types";

const KEY = "keysmith-todos";

function read(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Todo[];
  } catch {
    return [];
  }
}

function write(todos: Todo[]): void {
  localStorage.setItem(KEY, JSON.stringify(todos));
}

function uuid(): string {
  return crypto.randomUUID();
}

export const storage = {
  getAll(): Todo[] {
    return read().sort((a, b) => b.createdAt - a.createdAt);
  },

  getById(id: string): Todo | undefined {
    return read().find((t) => t.id === id);
  },

  getByStatus(completed: boolean): Todo[] {
    return read()
      .filter((t) => t.completed === completed)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getStats(): TodoStats {
    const todos = read();
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      pending: todos.filter((t) => !t.completed).length,
      byPriority: {
        low: todos.filter((t) => t.priority === "low").length,
        medium: todos.filter((t) => t.priority === "medium").length,
        high: todos.filter((t) => t.priority === "high").length,
      },
    };
  },

  create(title: string, priority: Priority): Todo {
    const todo: Todo = {
      id: uuid(),
      title: title.trim(),
      completed: false,
      priority,
      createdAt: Date.now(),
    };
    write([...read(), todo]);
    return todo;
  },

  update(id: string, patch: Partial<Pick<Todo, "title" | "priority">>): Todo {
    const todos = read();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Todo ${id} not found`);
    const updated = { ...todos[idx]!, ...patch };
    todos[idx] = updated;
    write(todos);
    return updated;
  },

  toggle(id: string): Todo {
    const todos = read();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Todo ${id} not found`);
    const updated = { ...todos[idx]!, completed: !todos[idx]!.completed };
    todos[idx] = updated;
    write(todos);
    return updated;
  },

  remove(id: string): void {
    write(read().filter((t) => t.id !== id));
  },

  clearCompleted(): void {
    write(read().filter((t) => !t.completed));
  },
};
