<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { todoQueries } from "../queries/todos";
import type { FilterStatus } from "../types";

const props = defineProps<{ modelValue: FilterStatus }>();
const emit = defineEmits<{ "update:modelValue": [FilterStatus] }>();

const { data: stats } = useQuery(todoQueries.stats());

const filters: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

function count(f: FilterStatus) {
  if (!stats.value) return 0;
  if (f === "all") return stats.value.total;
  if (f === "active") return stats.value.pending;
  return stats.value.completed;
}
</script>

<template>
  <div class="filters">
    <button
      v-for="f in filters"
      :key="f.value"
      class="filter-btn"
      :class="{ active: modelValue === f.value }"
      @click="emit('update:modelValue', f.value)"
    >
      {{ f.label }}
      <span class="badge">{{ count(f.value) }}</span>
    </button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--c-border);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  border: none;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  transition: color 0.12s;
  position: relative;
}

.filter-btn::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background 0.15s;
}

.filter-btn:hover {
  color: var(--c-text-secondary);
}

.filter-btn.active {
  color: var(--c-accent);
}

.filter-btn.active::after {
  background: var(--c-accent);
}

.badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: inherit;
  opacity: 0.6;
}
</style>
