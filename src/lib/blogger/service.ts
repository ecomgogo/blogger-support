const BLOGGER_API_BASE = "https://www.googleapis.com/blogger/v3";

export interface BloggerBlog {
  id: string;
  name: string;
  url: string;
  posts?: { totalItems: number };
}

interface BloggerBlogsResponse {
  items?: BloggerBlog[];
}

/**
 * List all Blogger blogs for the authenticated user.
 */
export async function listBlogs(accessToken: string): Promise<BloggerBlog[]> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/users/self/blogs?fields=items(id,name,url,posts(totalItems))`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Blogger API error: ${response.status} ${response.statusText}`);
  }

  const data: BloggerBlogsResponse = await response.json();
  return data.items ?? [];
}

/**
 * Get a single blog by ID.
 */
export async function getBlog(
  accessToken: string,
  blogId: string
): Promise<BloggerBlog> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}?fields=id,name,url,posts(totalItems)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Blogger API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
