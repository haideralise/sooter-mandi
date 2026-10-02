'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { AuthRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  roles: AuthRole[];
}

/** Mirrors the role middleware on the API routes. */
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Rates', roles: ['client', 'broker', 'admin'] },
  { href: '/reports', label: 'Trends', roles: ['client', 'broker', 'admin'] },
  { href: '/settings', label: 'Subscriptions', roles: ['client'] },
  { href: '/broker/rates', label: 'Update Rate', roles: ['broker', 'admin'] },
  { href: '/admin/agencies', label: 'Agencies', roles: ['admin'] },
  { href: '/admin/threads', label: 'Threads', roles: ['admin'] },
  { href: '/admin/reports', label: 'Reports', roles: ['admin'] },
  { href: '/admin/activity-logs', label: 'Activity', roles: ['admin'] },
];

const ROLE_BADGE: Record<AuthRole, string> = {
  admin: 'bg-primary-100 text-primary-700',
  broker: 'bg-warning-50 text-warning-700',
  client: 'bg-neutral-100 text-neutral-600',
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      aria-hidden="true"
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      )}
    </svg>
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const items = NAV.filter((item) => role && item.roles.includes(role));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Close on navigation, so tapping a link does not leave the panel hanging open.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes; also stop background scroll while the panel covers the page.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.replace('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="shrink-0">
            <span className="text-xl font-bold text-neutral-900">🧵 SooterMandi</span>
            <span className="hidden sm:block text-xs text-neutral-500">
              Live Thread Market Rates
            </span>
          </Link>

          {/* Desktop account block */}
          <div className="hidden md:block text-right shrink-0">
            <p className="text-sm font-medium text-neutral-900">{user?.name ?? '—'}</p>
            <div className="flex items-center justify-end gap-2">
              {role && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_BADGE[role]}`}
                >
                  {role}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Logout
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="md:hidden -mr-2 p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <MenuIcon open={open} />
          </button>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:flex gap-1 -mb-px">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive(item.href)
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile panel */}
      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="md:hidden border-t border-neutral-200 bg-white max-h-[calc(100vh-4.5rem)] overflow-y-auto"
        >
          <nav className="px-2 py-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-neutral-200 px-5 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user?.name ?? '—'}</p>
              {role && (
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_BADGE[role]}`}
                >
                  {role}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 px-4 py-2 text-sm font-medium text-alert-600 hover:bg-alert-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
