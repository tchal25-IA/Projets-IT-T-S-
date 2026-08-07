import type { NextAuthConfig } from "next-auth";

export type AppRole =
  | "ASSOCIE"
  | "DIRECTION_VF"
  | "DIRECTION_BOOKFLOW"
  | "COMMERCIAL"
  | "APPORTEUR"
  | "ADMIN";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if ((auth as { error?: string } | null)?.error === "Inactive") {
        return false;
      }
      const isLoggedIn = !!auth?.user;
      const isAuthPage = pathname.startsWith("/login");
      const isPublic =
        isAuthPage ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/webhooks/") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/sw.js";

      if (!isLoggedIn && !isPublic) return false;
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: AppRole }).role;
        token.fullName = (user as { fullName: string }).fullName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.fullName = token.fullName as string;
        session.user.email = (token.email as string) ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
