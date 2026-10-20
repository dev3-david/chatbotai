import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe part of the Auth.js config: no database imports.
 * Used by proxy.ts to gate /admin, and spread into the full config in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // added in auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminArea) return true;
      return auth?.user?.isAdmin === true;
    },
    jwt({ token, user }) {
      if (user) token.isAdmin = user.isAdmin === true;
      return token;
    },
    session({ session, token }) {
      session.user.isAdmin = token.isAdmin === true;
      return session;
    },
  },
} satisfies NextAuthConfig;
