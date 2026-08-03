import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const getApiUrl = () =>
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chessthan.onrender.com";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder"
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder"
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: credentials?.username,
              password: credentials?.password
            })
          });

          if (res.ok) {
            const user = await res.json();
            return user;
          }
          return null;
        } catch (e) {
          console.error("NextAuth credentials auth error:", e);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/v1/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              avatarUrl: user.image
            })
          });

          if (res.ok) {
            const dbUser = await res.json();
            user.id = dbUser.id;
            user.name = dbUser.name;
            user.email = dbUser.email;
            (user as any).wins = dbUser.wins;
            (user as any).losses = dbUser.losses;
            (user as any).draws = dbUser.draws;
            (user as any).avatarUrl = dbUser.avatarUrl;
            (user as any).subscriptionStatus = dbUser.subscriptionStatus;
            (user as any).puzzleRating = dbUser.puzzleRating;
          } else {
            console.warn("Backend OAuth sync non-200, proceeding with OAuth profile:", res.status);
            user.id = user.id || `oauth_${Date.now()}`;
          }
          return true;
        } catch (e) {
          console.error("OAuth database sync error:", e);
          user.id = user.id || `oauth_${Date.now()}`;
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.wins = (user as any).wins || 0;
        token.losses = (user as any).losses || 0;
        token.draws = (user as any).draws || 0;
        token.avatarUrl = (user as any).avatarUrl || null;
        token.subscriptionStatus = (user as any).subscriptionStatus || null;
        token.puzzleRating = (user as any).puzzleRating || 1200;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).wins = token.wins;
        (session.user as any).losses = token.losses;
        (session.user as any).draws = token.draws;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).puzzleRating = token.puzzleRating;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
    error: "/"
  }
});

export { handler as GET, handler as POST };
