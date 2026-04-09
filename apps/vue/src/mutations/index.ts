import { mergeMutationFactories } from "@querykeysmith/mutations";
import { todoMutations } from "./todos";

/**
 * Merged mutation factory — single import point for all domain mutation factories.
 *
 * As the app grows, add new domain factories here:
 *
 *   import { userMutations } from "./users";
 *   import { postMutations } from "./posts";
 *
 *   export const mutations = mergeMutationFactories({
 *     todos: todoMutations,
 *     users: userMutations,
 *     posts: postMutations,
 *   });
 *
 * All mutation keys and ._def values are unchanged — mergeMutationFactories is
 * an identity function that only groups factories for a single import.
 *
 *   mutations.todos._def               → ['todos']
 *   mutations.todos.update(id)         → { mutationKey: ['todos', 'update', id], ... }
 */
export const mutations = mergeMutationFactories({
  todos: todoMutations,
});
