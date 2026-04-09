import { mergeQueryFactories } from "@querykeysmith/core";
import { todoQueries } from "./todos";

/**
 * Merged query factory — single import point for all domain query factories.
 *
 * As the app grows, add new domain factories here:
 *
 *   import { userQueries } from "./users";
 *   import { postQueries } from "./posts";
 *
 *   export const queries = mergeQueryFactories({
 *     todos: todoQueries,
 *     users: userQueries,
 *     posts: postQueries,
 *   });
 *
 * All query keys and ._def values are unchanged — mergeQueryFactories is
 * an identity function that only groups factories for a single import.
 *
 *   queries.todos._def                 → ['todos']
 *   queries.todos.detail(id).queryKey  → ['todos', 'detail', id]
 */
export const queries = mergeQueryFactories({
  todos: todoQueries,
});
