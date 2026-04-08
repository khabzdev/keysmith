export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: Record<Priority, number>;
}

export type FilterStatus = "all" | "active" | "completed";

export interface KeysmithEvent {
  id: number;
  timestamp: number;
  type: "namespace" | "definition" | "instance";
  key: readonly unknown[];
  label: string;
}
