<script setup lang="ts">
import { shallowRef } from "vue";
import { provideKeysmithBus } from "./composables/useKeysmithBus";
import TodoHeader from "./components/TodoHeader.vue";
import TodoForm from "./components/TodoForm.vue";
import TodoFilters from "./components/TodoFilters.vue";
import TodoList from "./components/TodoList.vue";
import TodoStats from "./components/TodoStats.vue";
import type { FilterStatus } from "./types";

const bus = provideKeysmithBus();
const filter = shallowRef<FilterStatus>("all");
</script>

<template>
  <div class="app-shell">
    <TodoHeader />
    <TodoForm />
    <TodoFilters v-model="filter" />
    <TodoList :filter="filter" />
    <TodoStats />

    <!-- Live keysmith event log — showcases cache key hierarchy -->
    <Transition name="fade">
      <section v-if="bus.events.value.length" class="event-log">
        <h3 class="event-log__title">Keysmith Events</h3>
        <TransitionGroup name="log" tag="ul" class="event-log__list">
          <li
            v-for="e in bus.events.value"
            :key="e.id"
            class="event-log__item"
            :class="`event-log__item--${e.type}`"
          >
            <span class="event-log__badge">{{ e.type }}</span>
            <code class="event-log__key">{{ JSON.stringify(e.key) }}</code>
            <span class="event-log__label">{{ e.label }}</span>
          </li>
        </TransitionGroup>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.app-shell {
  max-width: 520px;
  margin: 0 auto;
}

/* ── Event log ───────────────────────────────────────────────────────── */
.event-log {
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 2px solid var(--c-text);
}

.event-log__title {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--c-muted);
  margin-bottom: 0.6rem;
}

.event-log__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.event-log__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--c-border);
}

.event-log__badge {
  font-size: 0.55rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.1rem 0.35rem;
  border: 1px solid;
  flex-shrink: 0;
}

.event-log__item--namespace .event-log__badge {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.event-log__item--definition .event-log__badge {
  border-color: var(--c-warning);
  color: var(--c-warning);
}

.event-log__item--instance .event-log__badge {
  border-color: var(--c-success);
  color: var(--c-success);
}

.event-log__key {
  font-size: 0.65rem;
  color: var(--c-text-secondary);
  flex-shrink: 0;
}

.event-log__label {
  flex: 1;
  text-align: right;
  color: var(--c-muted);
  font-size: 0.6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.log-enter-active,
.log-leave-active {
  transition: all 0.2s ease;
}
.log-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.log-leave-to {
  opacity: 0;
}
.log-move {
  transition: transform 0.2s ease;
}
</style>
