import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import crypto from "crypto";
import prisma from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_ID_PLACEHOLDER",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_SECRET_PLACEHOLDER",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) return null;

          const hashedPassword = crypto
            .createHash("sha256")
            .update(credentials.password)
            .digest("hex");

          if (user.password !== hashedPassword) return null;

          if (!user.emailVerified) {
            throw new Error("unverified");
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          if (error.message === "unverified") {
            throw new Error("Akun Anda belum terverifikasi. Silakan daftar kembali.");
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "database",
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
  secret: process.env.NEXTAUTH_SECRET || "SIGN_EASE_FALLBACK_SECRET_FOR_DEV_PURPOSES",
};
