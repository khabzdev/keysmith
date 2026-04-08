import { createQueryFactory } from "@querykeysmith/core";
import { storage } from "../lib/storage";

/**
 * Keysmith factory for all todo queries.
 *
 * Hierarchy:
 *   todoQueries._def              → ['todos']           (entire namespace)
 *   todoQueries.list._def         → ['todos', 'list']   (all list queries)
 *   todoQueries.detail._def       → ['todos', 'detail'] (all detail queries)
 *   todoQueries.byStatus._def     → ['todos', 'byStatus']
 *   todoQueries.stats._def        → ['todos', 'stats']
 *
 *   todoQueries.list()            → ['todos', 'list']
 *   todoQueries.detail(id)        → ['todos', 'detail', id]
 *   todoQueries.byStatus(bool)    → ['todos', 'byStatus', bool]
 *   todoQueries.stats()           → ['todos', 'stats']
 */
export const todoQueries = createQueryFactory("todos", {
  list: () => ({
    queryFn: () => Promise.resolve(storage.getAll()),
    staleTime: 0,
  }),

  detail: (id: string) => ({
    queryFn: () => Promise.resolve(storage.getById(id)),
    staleTime: 0,
  }),

  byStatus: (completed: boolean) => ({
    queryFn: () => Promise.resolve(storage.getByStatus(completed)),
    staleTime: 0,
  }),

  stats: () => ({
    queryFn: () => Promise.resolve(storage.getStats()),
    staleTime: 0,
  }),
});
