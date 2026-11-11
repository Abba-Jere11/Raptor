import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const path = request.nextUrl.pathname;
  const next = `${path}${request.nextUrl.search}`;
  const isPortal = path.startsWith("/admin") || path.startsWith("/ceo");

  if (isPortal) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = routes.signIn;
      url.searchParams.set("next", next);
      return NextResponse.redirect(url);
    }
    if (aal?.currentLevel !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = routes.twoStep;
      url.searchParams.set("next", next);
      return NextResponse.redirect(url);
    }
  }

  response.headers.set("x-pathname", path);
  return response;
}
