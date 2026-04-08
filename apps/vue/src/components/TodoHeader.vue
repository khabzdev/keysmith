<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { todoQueries } from "../queries/todos";

const { data: stats } = useQuery(todoQueries.stats());

const progress = computed(() => {
  if (!stats.value || stats.value.total === 0) return 0;
  return Math.round((stats.value.completed / stats.value.total) * 100);
});
</script>

<template>
  <header class="header">
    <div class="title-row">
      <div class="logo">
        <span class="logo-mark" aria-hidden="true">&lsaquo;/&rsaquo;</span>
        <div class="logo-text">
          <span class="logo-name">keysmith</span>
          <span class="logo-tag">workshop</span>
        </div>
      </div>
      <div class="counters" v-if="stats">
        <span class="counter">
          <span class="counter-value">{{ stats.pending }}</span>
          <span class="counter-label">open</span>
        </span>
        <span class="counter-sep">/</span>
        <span class="counter">
          <span class="counter-value">{{ stats.total }}</span>
          <span class="counter-label">total</span>
        </span>
      </div>
    </div>

    <div class="progress-wrap" v-if="stats && stats.total > 0">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <span class="progress-pct">{{ progress }}%</span>
    </div>
  </header>
</template>

<style scoped>
.header {
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--c-text);
  padding-bottom: 1.25rem;
}

.title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.logo-mark {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius);
  letter-spacing: -0.05em;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.logo-name {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--c-text);
  letter-spacing: -0.04em;
}

.logo-tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 300;
  color: var(--c-muted);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 3px;
}

.counters {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  font-family: var(--font-mono);
}

.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.counter-value {
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--c-text);
  line-height: 1;
}

.counter-label {
  font-size: 0.55rem;
  color: var(--c-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 2px;
}

.counter-sep {
  font-size: 0.85rem;
  color: var(--c-border-heavy);
  align-self: flex-start;
  margin-top: 0.15rem;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-track {
  flex: 1;
  height: 3px;
  background: var(--c-border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--c-accent);
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.progress-pct {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--c-muted);
  min-width: 2.5rem;
  text-align: right;
}
</style>
