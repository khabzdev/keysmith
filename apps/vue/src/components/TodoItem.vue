<script setup lang="ts">
import { ref } from "vue";
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from "../mutations/todos";
import type { Todo, Priority } from "../types";

const props = defineProps<{ todo: Todo }>();

const editing = ref(false);
const editTitle = ref("");
const editPriority = ref<Priority>("medium");

const { mutate: toggle } = useToggleTodo();
const { mutate: remove } = useDeleteTodo();
const { mutate: update } = useUpdateTodo();

function startEdit() {
  editTitle.value = props.todo.title;
  editPriority.value = props.todo.priority;
  editing.value = true;
}

function saveEdit() {
  const t = editTitle.value.trim();
  if (!t) return cancelEdit();
  update({ id: props.todo.id, title: t, priority: editPriority.value });
  editing.value = false;
}

function cancelEdit() {
  editing.value = false;
}
</script>

<template>
  <div class="item" :class="{ completed: todo.completed, editing }">
    <!-- Checkbox -->
    <button
      class="checkbox"
      @click="toggle(todo.id)"
      :aria-label="todo.completed ? 'Mark incomplete' : 'Mark complete'"
    >
      <span class="check-mark" :class="{ checked: todo.completed }">
        <template v-if="todo.completed">&check;</template>
      </span>
    </button>

    <!-- Content -->
    <div class="content" v-if="!editing">
      <span class="title" @dblclick="startEdit">{{ todo.title }}</span>
      <span class="priority-tag" :class="`priority-tag--${todo.priority}`">{{
        todo.priority[0]
      }}</span>
    </div>

    <!-- Edit mode -->
    <div class="edit-form" v-else>
      <input
        v-model="editTitle"
        class="edit-input"
        @keydown.enter="saveEdit"
        @keydown.esc="cancelEdit"
        v-focus
      />
      <div class="edit-priorities">
        <button
          v-for="p in ['low', 'medium', 'high'] as Priority[]"
          :key="p"
          type="button"
          class="edit-priority-btn"
          :class="{ active: editPriority === p }"
          @click="editPriority = p"
        >
          {{ p[0] }}
        </button>
      </div>
      <button class="save-btn" @click="saveEdit">&check;</button>
      <button class="cancel-btn" @click="cancelEdit">&times;</button>
    </div>

    <!-- Actions -->
    <div class="actions" v-if="!editing">
      <button class="edit-btn" @click="startEdit" title="Edit">edit</button>
      <button class="delete-btn" @click="remove(todo.id)" title="Delete">&times;</button>
    </div>
  </div>
</template>

<!-- Custom directive for auto-focus -->
<script lang="ts">
import type { Directive } from "vue";
export const vFocus: Directive = {
  mounted(el: HTMLElement) {
    el.focus();
  },
};
</script>

<style scoped>
.item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--c-border);
  transition: background 0.1s;
}

.item:hover {
  background: var(--c-surface);
}

.item.completed .title {
  text-decoration: line-through;
  color: var(--c-muted);
}

.checkbox {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.check-mark {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--c-border-heavy);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: transparent;
  transition: all 0.15s;
}

.check-mark.checked {
  background: var(--c-text);
  border-color: var(--c-text);
  color: var(--c-bg);
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.title {
  flex: 1;
  font-family: var(--font-serif);
  font-size: 0.92rem;
  color: var(--c-text);
  cursor: text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-tag {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.35rem;
  border: 1px solid;
  flex-shrink: 0;
}

.priority-tag--low {
  color: var(--c-success);
  border-color: var(--c-success);
}

.priority-tag--medium {
  color: var(--c-warning);
  border-color: var(--c-warning);
}

.priority-tag--high {
  color: var(--c-danger);
  border-color: var(--c-danger);
}

.actions {
  display: flex;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.1s;
}

.item:hover .actions {
  opacity: 1;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  transition: color 0.1s;
  color: var(--c-muted);
}

.edit-btn:hover {
  color: var(--c-accent);
}

.delete-btn {
  font-size: 0.85rem;
}

.delete-btn:hover {
  color: var(--c-danger);
}

/* Edit mode */
.edit-form {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.edit-input {
  flex: 1;
  min-width: 100px;
  background: var(--c-surface);
  border: none;
  border-bottom: 2px solid var(--c-accent);
  padding: 0.25rem 0.4rem;
  font-family: var(--font-serif);
  font-size: 0.9rem;
  color: var(--c-text);
  outline: none;
}

.edit-priorities {
  display: flex;
  gap: 1px;
}

.edit-priority-btn {
  padding: 0.15rem 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 400;
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.1s;
}

.edit-priority-btn.active {
  background: var(--c-text);
  border-color: var(--c-text);
  color: var(--c-bg);
}

.save-btn {
  padding: 0.2rem 0.5rem;
  background: var(--c-text);
  color: var(--c-bg);
  font-size: 0.8rem;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: none;
  border: none;
  color: var(--c-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.35rem;
}

.cancel-btn:hover {
  color: var(--c-danger);
}
</style>
