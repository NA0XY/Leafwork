import Link from "next/link";

const toolLinks = [
  ["Merge", "/tools/merge"],
  ["Split", "/tools/split"],
  ["Compress", "/tools/compress"],
  ["PDF to Word", "/tools/pdf-to-word"],
  ["PDF to Images", "/tools/pdf-to-images"],
  ["Watermark", "/tools/watermark"],
  ["Sign", "/tools/sign"],
  ["Redact", "/tools/redact"],
  ["Rotate", "/tools/rotate"],
  ["Metadata Strip", "/tools/metadata-strip"],
  ["Summarize", "/tools/summarize"]
] as const;

export const Footer = () => (
  <footer className="mt-12 border-t-2 border-ink bg-surface">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-3">
      <div className="space-y-2">
        <p className="text-xl font-bold text-primary">Leafwork</p>
        <p className="text-sm font-medium">Local-first document tools. Your files, your machine.</p>
        <p className="text-sm text-muted">No uploads. No tracking. No ads.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-widest text-muted">Tools</p>
        <div className="hidden grid-cols-2 gap-2 text-sm md:grid">
          {toolLinks.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-brutal border-2 border-ink bg-paper px-2 py-1 font-semibold hover:bg-green-100">
              {label}
            </Link>
          ))}
        </div>
        <Link href="/tools" className="inline-flex rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold md:hidden">
          See all tools
        </Link>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Link href="/about" className="rounded-brutal border-2 border-ink bg-paper px-2 py-1 font-semibold">
            About
          </Link>
          <Link href="/about#privacy" className="rounded-brutal border-2 border-ink bg-paper px-2 py-1 font-semibold">
            Privacy
          </Link>
          <a
            href="https://github.com/example/leafwork"
            target="_blank"
            rel="noreferrer"
            className="rounded-brutal border-2 border-ink bg-paper px-2 py-1 font-semibold"
          >
            GitHub
          </a>
          <Link href="/status" className="rounded-brutal border-2 border-ink bg-paper px-2 py-1 font-semibold">
            Status
          </Link>
        </div>
        <p className="text-muted">Built with pdf-lib, pdfjs-dist, and Groq. 100% free.</p>
      </div>
    </div>

    <div className="border-t-2 border-ink">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-xs font-semibold">
        <span>Copyright 2025 Leafwork</span>
        <span>Made with care</span>
      </div>
    </div>
  </footer>
);
