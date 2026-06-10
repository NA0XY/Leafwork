import Link from "next/link";

const popularTools = [
  ["Merge", "/tools/merge"],
  ["Split", "/tools/split"],
  ["Sign", "/tools/sign"]
] as const;

export default function NotFound() {
  return (
    <section className="mx-auto mt-10 max-w-2xl rounded-brutal border-2 border-ink bg-surface p-8 text-center shadow-brutal">
      <p className="animate-wiggle text-6xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-2xl font-bold">Lost? Your files are not. All tools are still here.</h1>
      <p className="mt-2 text-sm text-muted">The route was not found, but your local workflow is one click away.</p>

      <Link href="/tools" className="mt-5 inline-block rounded-brutal border-2 border-ink bg-accent px-4 py-2 font-bold">
        Back to Tools
      </Link>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {popularTools.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold">
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
