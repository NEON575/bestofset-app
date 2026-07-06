import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-poçt", type: "email" },
        password: { label: "Şifrə", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Rol-əsaslı görünürlük qaydaları (səhifə/API tərəfində istifadə üçün) */
export const ROLE_ACCESS: Record<string, string[]> = {
  ADMIN: [
    "dashboard", "orders", "production", "invoices", "customers", "payments",
    "costs", "inventory", "purchases", "debts", "employees", "salaries", "settings",
  ],
  MANAGER: ["dashboard", "orders", "production", "invoices", "customers", "payments", "employees"],
  WORKER: ["orders", "production"],
};

export function canAccess(role: string | undefined, section: string): boolean {
  if (!role) return false;
  return (ROLE_ACCESS[role] || []).includes(section);
}
