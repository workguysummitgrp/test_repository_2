'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { SearchBar } from './SearchBar';
import { useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = session?.user as { id: string; name: string; role: string; image?: string } | undefined;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-h3 font-bold text-primary">News Portal</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link href="/" className="text-sm font-medium text-neutral-700 hover:text-primary">
              Home
            </Link>
            <Link href="/search" className="text-sm font-medium text-neutral-700 hover:text-primary">
              Search
            </Link>
            {user && ['editor', 'reviewer', 'admin'].includes(user.role) && (
              <Link href="/dashboard" className="text-sm font-medium text-neutral-700 hover:text-primary">
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-sm font-medium text-neutral-700 hover:text-primary">
                Admin
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-body-sm text-neutral-700">
                  {user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn-secondary text-body-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-secondary text-body-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-body-sm">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-neutral-300 py-4 space-y-2" aria-label="Mobile navigation">
            <Link href="/" className="block py-2 text-sm font-medium text-neutral-700" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/search" className="block py-2 text-sm font-medium text-neutral-700" onClick={() => setMobileMenuOpen(false)}>Search</Link>
            {user && ['editor', 'reviewer', 'admin'].includes(user.role) && (
              <Link href="/dashboard" className="block py-2 text-sm font-medium text-neutral-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="block py-2 text-sm font-medium text-neutral-700" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
