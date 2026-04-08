<script setup lang="ts">
import { ref } from "vue";
import { useCreateTodo } from "../mutations/todos";
import type { Priority } from "../types";

const title = ref("");
const priority = ref<Priority>("medium");
const { mutate: create, isPending } = useCreateTodo();

function submit() {
  const t = title.value.trim();
  if (!t) return;
  create({ title: t, priority: priority.value });
  title.value = "";
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <input
      v-model="title"
      class="input"
      placeholder="What needs to be done?"
      :disabled="isPending"
      autofocus
    />
    <div class="controls">
      <div class="priority-group">
        <button
          v-for="p in ['low', 'medium', 'high'] as Priority[]"
          :key="p"
          type="button"
          class="priority-btn"
          :class="[`priority-btn--${p}`, { active: priority === p }]"
          @click="priority = p"
        >
          {{ p }}
        </button>
      </div>
      <button type="submit" class="add-btn" :disabled="!title.trim() || isPending">
        <span v-if="isPending">Adding…</span>
        <span v-else>+ Add</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.input {
  width: 100%;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-bottom: 2px solid var(--c-border-heavy);
  border-radius: var(--radius);
  padding: 0.7rem 0.75rem;
  font-family: var(--font-serif);
  font-size: 1rem;
  color: var(--c-text);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input::placeholder {
  color: var(--c-muted);
  font-style: italic;
}

.input:focus {
  border-bottom-color: var(--c-accent);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.priority-group {
  display: flex;
  gap: 2px;
}

.priority-btn {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--c-border);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.12s;
}

.priority-btn:first-child {
  border-radius: var(--radius) 0 0 var(--radius);
}

.priority-btn:last-child {
  border-radius: 0 var(--radius) var(--radius) 0;
}

.priority-btn:not(:first-child) {
  border-left: none;
}

.priority-btn--low.active {
  background: var(--c-success);
  border-color: var(--c-success);
  color: #fff;
}

.priority-btn--medium.active {
  background: var(--c-warning);
  border-color: var(--c-warning);
  color: #fff;
}

.priority-btn--high.active {
  background: var(--c-danger);
  border-color: var(--c-danger);
  color: #fff;
}

.add-btn {
  padding: 0.45rem 1rem;
  border-radius: var(--radius);
  background: var(--c-text);
  color: var(--c-bg);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  background: var(--c-accent);
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
