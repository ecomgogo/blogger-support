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

// ─── Post types ───────────────────────────────────────────

export interface BloggerPost {
  id: string;
  title: string;
  content: string;
  labels?: string[];
  published?: string; // ISO date
  updated?: string;
  url?: string;
}

interface BloggerPostsResponse {
  items?: BloggerPost[];
  nextPageToken?: string;
}

/**
 * Create a new post on Blogger.
 */
export async function createPost(
  accessToken: string,
  blogId: string,
  post: { title: string; content: string; labels?: string[] }
): Promise<BloggerPost> {
  const response = await fetch(`${BLOGGER_API_BASE}/blogs/${blogId}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    throw new Error(`Blogger create post error: ${response.status}`);
  }

  return response.json();
}

/**
 * Update an existing post on Blogger.
 */
export async function updatePost(
  accessToken: string,
  blogId: string,
  postId: string,
  post: { title: string; content: string; labels?: string[] }
): Promise<BloggerPost> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts/${postId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    }
  );

  if (!response.ok) {
    throw new Error(`Blogger update post error: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a post from Blogger.
 */
export async function deletePost(
  accessToken: string,
  blogId: string,
  postId: string
): Promise<void> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts/${postId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Blogger delete post error: ${response.status}`);
  }
}

/**
 * List posts for a blog.
 */
export async function listPosts(
  accessToken: string,
  blogId: string,
  pageToken?: string
): Promise<{ posts: BloggerPost[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    fields: "items(id,title,content,labels,published,updated,url),nextPageToken",
    maxResults: "50",
  });
  if (pageToken) params.set("pageToken", pageToken);

  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Blogger list posts error: ${response.status}`);
  }

  const data: BloggerPostsResponse = await response.json();
  return { posts: data.items ?? [], nextPageToken: data.nextPageToken };
}

/**
 * Get a single post by ID.
 */
export async function getPost(
  accessToken: string,
  blogId: string,
  postId: string
): Promise<BloggerPost> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts/${postId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Blogger get post error: ${response.status}`);
  }

  return response.json();
}
