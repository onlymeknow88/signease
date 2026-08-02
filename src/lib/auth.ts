import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_ID_PLACEHOLDER",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_SECRET_PLACEHOLDER",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) return null;

          // Hybrid verification: support both bcrypt and legacy SHA-256
          let isValid = false;
          if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
            isValid = await bcrypt.compare(credentials.password as string, user.password);
          } else {
            // Legacy SHA-256 — verify then auto-migrate to bcrypt
            const sha256Hash = crypto
              .createHash("sha256")
              .update(credentials.password as string)
              .digest("hex");
            isValid = user.password === sha256Hash;
            if (isValid) {
              const bcryptHash = await bcrypt.hash(credentials.password as string, 12);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: bcryptHash },
              });
            }
          }

          if (!isValid) return null;

          if (!user.emailVerified) {
            throw new Error("unverified");
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
          };
        } catch (err: any) {
          if (err.message === "unverified") throw err;
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
    generateSessionToken: () => {
      return crypto.randomBytes(32).toString("hex");
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        (session.user as any).id = user?.id || "dev-user-id";
        // Baca plan langsung dari DB setiap session refresh
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: parseInt(user.id) },
            select: { plan: true, subscriptionStatus: true, subscriptionExpiresAt: true },
          });
          (session.user as any).plan = dbUser?.plan || "free";
          (session.user as any).subscriptionStatus = dbUser?.subscriptionStatus || "inactive";
          (session.user as any).subscriptionExpiresAt = dbUser?.subscriptionExpiresAt || null;
        } catch {
          (session.user as any).plan = "free";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
