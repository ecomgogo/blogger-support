import { redirect } from "next/navigation";

const OAUTH_URL =
  "https://tuymzcezoiqknkunmsrc.supabase.co/auth/v1/authorize?" +
  "provider=google" +
  "&redirect_to=" + encodeURIComponent("http://localhost:3000/auth/callback") +
  "&scopes=" + encodeURIComponent(
    "https://www.googleapis.com/auth/userinfo.email " +
    "https://www.googleapis.com/auth/userinfo.profile " +
    "https://www.googleapis.com/auth/blogger"
  );

export default function LoginPage() {
  redirect(OAUTH_URL);
}
