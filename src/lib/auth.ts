import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const useSupabase = !!(supabaseUrl && supabaseServiceKey);

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

function isDate(val: any): boolean {
  return (
    val instanceof Date ||
    (typeof val === "string" && !isNaN(Date.parse(val)) && val.includes("-") && val.includes("T"))
  );
}

function format<T>(obj: any): T {
  if (!obj) return obj;
  const newObj = { ...obj };
  for (const [key, value] of Object.entries(newObj)) {
    if (value === null) {
      delete newObj[key];
    }
    if (isDate(value)) {
      newObj[key] = new Date(value as string);
    }
  }
  return newObj as T;
}

function CustomSupabaseAdapter(supabaseClient: any): any {
  return {
    async createUser(user: any) {
      const { data, error } = await supabaseClient
        .from("users")
        .insert({
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified?.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async getUser(id: any) {
      const { data, error } = await supabaseClient
        .from("users")
        .select()
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return format(data);
    },
    async getUserByEmail(email: any) {
      const { data, error } = await supabaseClient
        .from("users")
        .select()
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return format(data);
    },
    async getUserByAccount({ providerAccountId, provider }: any) {
      const { data, error } = await supabaseClient
        .from("accounts")
        .select("users (*)")
        .match({ provider, providerAccountId })
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.users) return null;
      return format(data.users);
    },
    async updateUser(user: any) {
      const { data, error } = await supabaseClient
        .from("users")
        .update({
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified?.toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async linkAccount(account: any) {
      const { error } = await supabaseClient.from("accounts").insert({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
      if (error) throw error;
    },
    async createSession({ sessionToken, userId, expires }: any) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .insert({ sessionToken, userId, expires: expires.toISOString() })
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async getSessionAndUser(sessionToken: any) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .select("*, users(*)")
        .eq("sessionToken", sessionToken)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { users: user, ...session } = data;
      return {
        user: format(user),
        session: format(session),
      };
    },
    async updateSession(session: any) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .update({
          expires: session.expires?.toISOString(),
        })
        .eq("sessionToken", session.sessionToken)
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async deleteSession(sessionToken: any) {
      const { error } = await supabaseClient
        .from("sessions")
        .delete()
        .eq("sessionToken", sessionToken);
      if (error) throw error;
    },
    async createVerificationToken(token: any) {
      const { data, error } = await supabaseClient
        .from("verification_tokens")
        .insert({
          identifier: token.identifier,
          token: token.token,
          expires: token.expires.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async useVerificationToken({ identifier, token }: any) {
      const { data, error } = await supabaseClient
        .from("verification_tokens")
        .delete()
        .match({ identifier, token })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return format(data);
    },
  };
}

export const authOptions: NextAuthOptions = {
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
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .maybeSingle();

          if (error || !user) {
            return null;
          }

          // Compare password hash
          const hashedPassword = crypto.createHash("sha256").update(credentials.password).digest("hex");
          if (user.password !== hashedPassword) {
            return null;
          }

          // Verify if verified
          if (!user.emailVerified) {
            throw new Error("unverified");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          if (error.message === "unverified") {
            throw new Error("Akun Anda belum terverifikasi. Silakan daftar kembali.");
          }
          return null;
        }
      }
    })
  ],
  session: {
    strategy: useSupabase ? "database" : "jwt",
  },
  adapter: useSupabase ? CustomSupabaseAdapter(supabase) : undefined,
  callbacks: {
    async session({ session, token, user }) {
      if (session?.user) {
        (session.user as any).id = user?.id || token?.sub || "dev-user-id";
        (session.user as any).plan = "free";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "SIGN_EASE_FALLBACK_SECRET_FOR_DEV_PURPOSES",
};
