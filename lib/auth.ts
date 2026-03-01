import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

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
      // In development, bypass authentication so mock data pages are accessible
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      // In production, require a valid session
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
    GitHub,
    Google({
      // Temporarily commented out for testing
      // authorization: {
      //   params: {
      //     hd: 'nu.edu.pk',
      //   },
      // },
    }),
    // Development-only test authentication provider
    Credentials({
      id: "test",
      name: "Test Login",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        // Only allow in development environment
        if (process.env.NODE_ENV === "production") {
          return null;
        }

        const { userId } = credentials as { userId: string };

        // Validate test user exists and has test- prefix
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user && userId.startsWith("test-")) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
