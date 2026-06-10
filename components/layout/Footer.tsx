import Link from "next/link";

import { PrivacyChoicesButton } from "@/components/layout/PrivacyChoicesButton";
import { getAvailableToolNavItems } from "@/lib/utils/seo";

export const Footer = () => {
  const toolLinks = getAvailableToolNavItems();
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL?.trim() || "https://github.com/NA0XY/Leafwork";

  return (
    <footer className="mt-12 border-t-2 border-ink bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(13rem,1fr)_minmax(27rem,38rem)_minmax(13rem,1fr)] lg:items-start lg:gap-8 lg:px-8 xl:grid-cols-[minmax(16rem,1fr)_minmax(36rem,42rem)_minmax(16rem,1fr)] xl:gap-10">
        <div className="max-w-sm space-y-2 lg:justify-self-start">
          <p className="text-xl font-bold text-primary">Leafwork</p>
          <p className="text-sm font-medium">Local-first document tools. Your files, your machine.</p>
          <p className="text-sm text-muted">No file uploads for core tools. No ads.</p>
        </div>

        <div className="w-full space-y-2 lg:justify-self-center">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">Tools</p>
          <div className="hidden grid-cols-2 gap-2 text-sm md:grid">
            {toolLinks.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex min-h-10 items-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold leading-tight hover:bg-green-100"
              >
                {tool.name}
              </Link>
            ))}
          </div>
          <Link href="/tools" className="inline-flex rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold md:hidden">
            See all tools
          </Link>
        </div>

        <div className="w-full max-w-72 space-y-3 text-sm lg:justify-self-end">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/about" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold">
              About
            </Link>
            <Link href="/privacy" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold">
              Privacy
            </Link>
            <Link href="/terms" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold">
              Terms
            </Link>
            <Link href="/security" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold">
              Security
            </Link>
            <PrivacyChoicesButton />
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold"
            >
              GitHub
            </a>
            <Link href="/status" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold">
              Status
            </Link>
          </div>
          <p className="text-muted lg:text-right">Built with pdf-lib, PDF.js, Supabase, and Vercel. 100% free.</p>
        </div>
      </div>

      <div className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Copyright 2025 Leafwork</span>
          <span>Made with care</span>
        </div>
      </div>
    </footer>
  );
};
