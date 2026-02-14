import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
});
