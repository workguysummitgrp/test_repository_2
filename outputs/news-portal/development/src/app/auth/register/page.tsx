'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.displayName) errs.displayName = 'Display name is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) errs.password = 'Password must contain a number';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setErrors({ form: data.error?.message ?? 'Registration failed' });
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md mt-12">
        <div className="card text-center">
          <h1 className="text-h2 mb-4">Check Your Email</h1>
          <p className="text-neutral-500">
            If this email is not already registered, a verification link has been sent.
          </p>
          <Link href="/auth/login" className="btn-primary mt-6 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md mt-12">
      <div className="card">
        <h1 className="text-h2 text-center mb-6">Create Account</h1>

        {errors.form && (
          <div className="mb-4 rounded-md bg-accent-light p-3 text-sm text-accent" role="alert">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="input-field"
              required
              maxLength={50}
            />
            {errors.displayName && <p className="text-sm text-error mt-1">{errors.displayName}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
              autoComplete="email"
            />
            {errors.email && <p className="text-sm text-error mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-caption text-neutral-500 mt-1">
              Min 8 chars, 1 uppercase, 1 number
            </p>
            {errors.password && <p className="text-sm text-error mt-1">{errors.password}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
