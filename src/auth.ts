import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { verifyCredentials } from "./lib/users";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Email" }, password: { label: "Password", type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await verifyCredentials(parsed.data.email, parsed.data.password);
        // Only admins may sign in to version 1.
        if (!user || !user.isAdmin) return null;
        return { id: user.id, email: user.email, isAdmin: user.isAdmin };
      },
    }),
    // Version 2: add Google Workspace here, restricted to the company domain.
  ],
});

/** Throws unless the current session belongs to an admin. For server actions. */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Forbidden: admin only");
  }
  return { email: session.user.email };
}
