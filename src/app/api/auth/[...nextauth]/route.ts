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
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  pages: {
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
        } as {
          name?: string | null;
          email?: string | null;
          image?: string | null;
          id: string;
        };

        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.tokenType = account.token_type;
        token.provider = account.provider;
      }

      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };
