import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="text-h4 font-bold text-primary">News Portal</h3>
            <p className="mt-2 text-body-sm text-neutral-500">
              Your trusted source for breaking news, analysis, and investigative journalism.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-body-sm">
              <li><Link href="/" className="text-neutral-500 hover:text-primary">Home</Link></li>
              <li><Link href="/search" className="text-neutral-500 hover:text-primary">Search</Link></li>
              <li><Link href="/auth/register" className="text-neutral-500 hover:text-primary">Register</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-body-sm">
              <li><span className="text-neutral-500">Privacy Policy</span></li>
              <li><span className="text-neutral-500">Terms of Service</span></li>
              <li><span className="text-neutral-500">Cookie Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-300 pt-4 text-center text-caption text-neutral-500">
          &copy; {currentYear} News Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
