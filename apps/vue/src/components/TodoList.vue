<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { todoQueries } from "../queries/todos";
import TodoItem from "./TodoItem.vue";
import type { FilterStatus } from "../types";

const props = defineProps<{ filter: FilterStatus }>();

// Use the most targeted query for the active filter
const listQuery = useQuery(todoQueries.list());
const activeQuery = useQuery(todoQueries.byStatus(false));
const completedQuery = useQuery(todoQueries.byStatus(true));

const todos = computed(() => {
  if (props.filter === "active") return activeQuery.data.value ?? [];
  if (props.filter === "completed") return completedQuery.data.value ?? [];
  return listQuery.data.value ?? [];
});

const isLoading = computed(() => {
  if (props.filter === "active") return activeQuery.isLoading.value;
  if (props.filter === "completed") return completedQuery.isLoading.value;
  return listQuery.isLoading.value;
});
</script>

<template>
  <div class="list-wrap">
    <!-- Skeleton -->
    <template v-if="isLoading">
      <div v-for="i in 3" :key="i" class="skeleton" />
    </template>

    <!-- Empty state -->
    <div class="empty" v-else-if="todos.length === 0">
      <span class="empty-icon">{{ filter === "completed" ? "✓" : "○" }}</span>
      <p class="empty-text">
        {{
          filter === "completed"
            ? "No completed tasks yet"
            : filter === "active"
              ? "All caught up!"
              : "No tasks yet — add one above"
        }}
      </p>
    </div>

    <!-- List -->
    <TransitionGroup v-else name="list" tag="div" class="list">
      <TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.list-wrap {
  min-height: 80px;
}

.list {
  display: flex;
  flex-direction: column;
}

.skeleton {
  height: 48px;
  border-bottom: 1px solid var(--c-border);
  background: linear-gradient(90deg, transparent 25%, var(--c-surface-2) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--c-muted);
}

.empty-icon {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  opacity: 0.25;
}

.empty-text {
  font-size: 0.85rem;
  font-style: italic;
  margin: 0;
}

/* List transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.2s ease;
}
</style>
