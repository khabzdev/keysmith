import { QueryClient } from "@tanstack/query-core";
import { createQueryFactory } from "@querykeysmith/core";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// ── Factories ─────────────────────────────────────────────────────────────────

export const postQueries = createQueryFactory("posts", {
  list: () => ({
    queryFn: async () => {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts");
      return res.json() as Promise<Post[]>;
    },
    staleTime: 60_000,
  }),
  detail: (id: number) => ({
    queryFn: async () => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
      return res.json() as Promise<Post>;
    },
    staleTime: 60_000,
  }),
});

export const userQueries = createQueryFactory("users", {
  detail: (id: number) => ({
    queryFn: async () => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
      return res.json() as Promise<User>;
    },
  }),
});

// ── Demo: imperative usage via QueryClient (no framework required) ────────────

export async function runDemo(client: QueryClient): Promise<void> {
  // Prefetch post #1
  await client.prefetchQuery(postQueries.detail(1));

  // TypeScript infers: Post | undefined  (DataTag branding at work)
  const post = client.getQueryData(postQueries.detail(1).queryKey);

  // Invalidate all posts (namespace-level)
  await client.invalidateQueries({ queryKey: postQueries._def });

  // Invalidate only post details (definition-level)
  await client.invalidateQueries({ queryKey: postQueries.detail._def });

  // Invalidate a specific post
  await client.invalidateQueries(postQueries.detail(1));

  console.log("Fetched post:", post?.title);
}
