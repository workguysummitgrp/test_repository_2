import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours absolute timeout
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is locked. Please try again later or reset your password.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          // Increment failed login attempts
          const attempts = user.loginAttempts + 1;
          const updateData: Record<string, unknown> = { loginAttempts: attempts };
          if (attempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
          }
          await prisma.user.update({ where: { id: user.id }, data: updateData });
          return null;
        }

        if (user.status !== 'active' && user.status !== 'pending_verification') return null;

        // Reset login attempts on success
        await prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: null },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: UserRole }).role = token.role as UserRole;
      }
      return session;
    },
  },
};

// RBAC helper
const roleHierarchy: Record<UserRole, number> = {
  reader: 0,
  moderator: 1,
  editor: 2,
  reviewer: 3,
  admin: 4,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function requireRole(userRole: UserRole | undefined, requiredRole: UserRole): void {
  if (!userRole || !hasRole(userRole, requiredRole)) {
    throw new Error('FORBIDDEN');
  }
}
