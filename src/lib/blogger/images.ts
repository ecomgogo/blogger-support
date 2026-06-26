const BLOGGER_API_BASE = "https://www.googleapis.com/blogger/v3";

/**
 * Upload an image to Blogger. Returns the public URL.
 */
export async function uploadImage(
  accessToken: string,
  blogId: string,
  imageData: string, // base64 without data URI prefix
  fileName: string
): Promise<string> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/images/upload?uploadType=media&name=${encodeURIComponent(fileName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: Buffer.from(imageData, "base64"),
    }
  );

  if (!response.ok) {
    throw new Error(`Blogger image upload failed: ${response.status}`);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}
