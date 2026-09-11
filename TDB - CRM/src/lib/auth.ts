import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    fullName: string;
    organizationId?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      fullName: string;
      organizationId: string;
      organizationSlug?: string;
    };
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    fullName?: string;
    active?: boolean;
    lastCheck?: number;
    error?: string;
    organizationId?: string;
    organizationSlug?: string;
  }
}

const REFRESH_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8).max(128),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            organization: {
              select: {
                id: true,
                slug: true,
                active: true,
              },
            },
          },
        });
        if (!user || !user.active) return null;
        if (!user.organization?.active) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          organizationId: user.organization.id,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.fullName = user.fullName;
        token.email = user.email;
        token.organizationId = user.organizationId;
        token.active = true;
        token.lastCheck = Date.now();
        delete token.error;
        return token;
      }

      const now = Date.now();
      const last = token.lastCheck ?? 0;
      if (token.id && now - last > REFRESH_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            fullName: true,
            active: true,
            email: true,
            organizationId: true,
            organization: {
              select: {
                slug: true,
                active: true,
              },
            },
          },
        });
        token.lastCheck = now;
        if (!dbUser || !dbUser.active || !dbUser.organization?.active) {
          token.active = false;
          token.error = "Inactive";
          return token;
        }
        token.role = dbUser.role;
        token.fullName = dbUser.fullName;
        token.email = dbUser.email;
        token.organizationId = dbUser.organizationId;
        token.organizationSlug = dbUser.organization.slug;
        token.active = true;
        delete token.error;
      }
      return token;
    },
    session({ session, token }) {
      if (token.error) {
        session.error = token.error;
      }
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = token.role as Role;
        session.user.fullName = (token.fullName as string) ?? "";
        session.user.email = (token.email as string) ?? "";
        session.user.organizationId = (token.organizationId as string) ?? "";
        session.user.organizationSlug = token.organizationSlug as string | undefined;
      }
      return session;
    },
  },
});
