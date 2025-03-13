import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { API_BASE_URL } from "@/config";
import { db } from "../../../../shared/schema";

const handler = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.id && session.user) {
        // Fix the type issue by properly typing the session user
        session.user = {
          ...session.user,
          id: token.id as string,
        } as {
          name?: string | null;
          email?: string | null;
          image?: string | null;
          id: string;
        };

        // Add the access token to the session
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
      }
      console.log("NextAuth session callback:", session);
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id; // Store user ID in the token
      }

      // If we have an account with access token, store it in the token
      if (account?.access_token) {
        token.accessToken = account.access_token;
      } else if (user?.email) {
        // If we don't have an access token, try to get one from the backend
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user.email }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.access_token) {
              token.accessToken = data.access_token;
              console.log("Got access token from backend:", data.access_token);
            }
          }
        } catch (error) {
          console.error("Error getting access token from backend:", error);
        }
      }

      console.log("NextAuth JWT callback:", token);
      return token;
    },
  },
});

export { handler as GET, handler as POST };
