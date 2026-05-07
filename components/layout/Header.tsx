"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils/cn";
import { truncateFilename } from "@/lib/utils/format";

const navLinks = [
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" }
] as const;

const isActivePath = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

export const Header = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b-2 border-primary bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M5 14C5 7.5 10 4 16.5 4C18.5 4 20 5.5 20 7.5C20 14 14.5 20 8 20C6 20 4.5 18.5 4.5 16.5C4.5 15.7 4.7 14.8 5 14Z"
              fill="#22c55e"
              stroke="#1a1a1a"
              strokeWidth="2"
            />
            <path d="M8 16C11 14 14 11 16 8" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Leafwork
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-brutal border-2 border-ink px-3 py-2 text-sm font-semibold",
                isActivePath(pathname, link.href) ? "bg-accent text-ink" : "bg-paper text-ink hover:bg-green-100"
              )}
            >
              {link.label}
            </Link>
          ))}

          {!loading && isAuthenticated ? (
            <div className="ml-1 flex items-center gap-2">
              <span className="rounded-full border-2 border-ink bg-green-100 px-3 py-1 text-xs font-semibold">
                {truncateFilename(user?.email ?? "Account", 20)}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
                Logout
              </Button>
            </div>
          ) : (
            <Button href="/login" size="sm">
              Login
            </Button>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div ref={menuRef} className="border-b-2 border-ink bg-surface md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block border-t-2 border-ink px-4 py-3 text-sm font-semibold",
                  isActivePath(pathname, link.href) ? "bg-accent" : "bg-paper"
                )}
              >
                {link.label}
              </Link>
            ))}

            {!loading && isAuthenticated ? (
              <div className="space-y-3 border-t-2 border-ink px-4 py-3">
                <p className="rounded-full border-2 border-ink bg-green-100 px-3 py-1 text-xs font-semibold">
                  {truncateFilename(user?.email ?? "Account", 20)}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="border-t-2 border-ink px-4 py-3">
                <Button href="/login" size="sm" className="w-full">
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};
