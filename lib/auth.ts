import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import Google from "next-auth/providers/google";

/**
 * Type augmentation for Session
 * Required for proper TypeScript support with custom user.id field
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    id?: string;
  }
}

/**
 * NextAuth configuration optimized for performance.
 *
 * Uses JWT strategy to eliminate database session queries in middleware.
 * Database adapter still used for user/account management.
 *
 * Key optimizations:
 * - JWT session strategy: Cryptographic token validation (no DB queries)
 * - PrismaAdapter: User/account CRUD operations
 * - Callbacks: Properly attach user.id to JWT and session
 */
const config = {
  adapter: PrismaAdapter(prisma), // Still needed for user/account CRUD
  session: {
    strategy: "jwt", // JWT strategy eliminates database session queries
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Re-issue JWT every 24 hours
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    authorized({ auth: session }) {
      return !!session;
    },
    jwt: async ({ token, user }) => {
      // Attach user ID when user first signs in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Attach user ID from JWT token to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  providers: [
    // Google OAuth (primary): Enforces @nu.edu.pk university domain restriction
    // GitHub OAuth: Available as secondary provider (uncomment to enable)
    Google({
      // Enforce @nu.edu.pk domain restriction per Google OpenID Connect spec
      // See: https://developers.google.com/identity/openid-connect/openid-connect
      // The 'hd' parameter restricts sign-in to Google accounts with @nu.edu.pk domain
      authorization: {
        params: {
          hd: "nu.edu.pk", // ENABLED: Only university accounts allowed
        },
      },
      // Validate domain in callback (defense in depth)
      async profile(profile: Record<string, unknown>) {
        if (
          !profile.email ||
          typeof profile.email !== "string" ||
          !profile.email.endsWith("@nu.edu.pk")
        ) {
          throw new Error("Only @nu.edu.pk email addresses are allowed");
        }
        return {
          id: profile.sub as string,
          name: profile.name as string,
          email: profile.email as string,
          image: profile.picture as string,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
