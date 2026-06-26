import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
}

/**
 * Get a valid Google access token for a tenant.
 * Refreshes automatically if the current token is expired.
 */
export async function getValidAccessToken(tenantId: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { googleRefreshToken: true, googleAccessToken: true, googleTokenExpiry: true },
  });

  if (!tenant || !tenant.googleRefreshToken) return null;

  const refreshToken = decrypt(tenant.googleRefreshToken);
  if (!refreshToken) return null;

  // Check if current access token is still valid (5 minute buffer)
  if (tenant.googleAccessToken && tenant.googleTokenExpiry) {
    const now = Math.floor(Date.now() / 1000);
    if (tenant.googleTokenExpiry > now + 300) {
      const accessToken = decrypt(tenant.googleAccessToken);
      if (accessToken) return accessToken;
    }
  }

  // Token expired — refresh it
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

    // Store updated tokens
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        googleAccessToken: encrypt(data.access_token),
        googleTokenExpiry: expiresAt,
      },
    });

    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Store tokens after initial OAuth flow.
 */
export async function storeTokens(
  tenantId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      googleAccessToken: encrypt(accessToken),
      googleRefreshToken: encrypt(refreshToken),
      googleTokenExpiry: expiresAt,
    },
  });
}
