<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { todoQueries } from "../queries/todos";
import { useClearCompleted } from "../mutations/todos";

const { data: stats } = useQuery(todoQueries.stats());
const { mutate: clearCompleted, isPending } = useClearCompleted();
</script>

<template>
  <div class="stats" v-if="stats && stats.total > 0">
    <div class="priority-row">
      <span class="priority-chip low">L:{{ stats.byPriority.low }}</span>
      <span class="priority-chip medium">M:{{ stats.byPriority.medium }}</span>
      <span class="priority-chip high">H:{{ stats.byPriority.high }}</span>
    </div>

    <button
      v-if="stats.completed > 0"
      class="clear-btn"
      @click="clearCompleted()"
      :disabled="isPending"
    >
      clear {{ stats.completed }} done
    </button>
  </div>
</template>

<style scoped>
.stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--c-border);
}

.priority-row {
  display: flex;
  gap: 0.5rem;
}

.priority-chip {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  color: var(--c-muted);
}

.priority-chip.low {
  color: var(--c-success);
}
.priority-chip.medium {
  color: var(--c-warning);
}
.priority-chip.high {
  color: var(--c-danger);
}

.clear-btn {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--c-muted);
  background: none;
  border: 1px solid var(--c-border);
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: all 0.12s;
  letter-spacing: 0.02em;
}

.clear-btn:hover:not(:disabled) {
  background: var(--c-danger-soft);
  border-color: var(--c-danger);
  color: var(--c-danger);
}

.clear-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
