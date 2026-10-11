import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageLoad } from "./$types";

// Prerender every post explicitly, not only the ones the crawler happens to reach
export const entries: EntryGenerator = () =>
  Object.keys(import.meta.glob("/src/posts/*.md")).map((path) => ({
    slug: path.split("/").pop()!.replace(/\.md$/, ""),
  }));

export const load: PageLoad = async ({ params }) => {
  try {
    const post = await import(`../../../posts/${params.slug}.md`);

    return {
      content: post.default,
      metadata: post.metadata,
    };
  } catch (e) {
    throw error(404, "Post not found");
  }
};
