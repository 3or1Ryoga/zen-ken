import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Mock authentication for Week 1
        // In Week 2, this will connect to Go backend
        if (
          credentials?.email === "test@example.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "1",
            email: credentials.email,
            name: "Test User",
            image: null,
          };
        }

        // Demo user for easier testing
        if (credentials?.email && credentials?.password === "demo") {
          return {
            id: "demo",
            email: credentials.email,
            name: credentials.email.split("@")[0],
            image: null,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
};
