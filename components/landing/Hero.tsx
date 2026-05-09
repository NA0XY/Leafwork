"use client";

import Link from "next/link";
import { Ban, Infinity as InfinityIcon, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { DropZone } from "@/components/ui/DropZone";
import { useCanvasStore } from "@/store/canvas-store";

const terminalRows = [
  "> Loading PDF engine...           OK",
  "> Parsing pages in browser...     OK",
  "> Processing edits locally...     OK",
  "> Server transmission...          BLOCKED"
] as const;

const stats = [
  {
    icon: Lock,
    value: "0",
    label: "bytes uploaded"
  },
  {
    icon: Ban,
    value: "0",
    label: "ads ever"
  },
  {
    icon: InfinityIcon,
    value: "inf",
    label: "file size"
  }
] as const;

export const Hero = () => {
  const router = useRouter();
  const addFiles = useCanvasStore((state) => state.addFiles);
  const setPendingFileNames = useCanvasStore((state) => state.setPendingFileNames);

  return (
    <section className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal md:p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border-2 border-ink bg-green-100 px-2 py-0.5 text-xs font-bold">
            100% free - No account required
          </span>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            PDF Tools That <span className="hero-never relative">Never</span> See Your Files.
          </h1>

          <p className="text-base text-muted md:text-lg">
            Merge, compress, redact, sign. Everything runs inside your own browser. Zero uploads, zero anxiety.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {stats.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="brutalist-card animate-slideUp bg-green-50 p-3"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="mb-1 flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <span className="font-mono text-lg font-bold">{item.value}</span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/tools" className="brutalist-btn inline-flex items-center justify-center px-5 py-3 text-sm font-bold">
              Open the toolbox
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center rounded-brutal border-2 border-ink bg-paper px-5 py-3 text-sm font-bold shadow-brutal">
              How does it work?
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-brutal border-2 border-green-800 bg-green-950 p-4 font-mono text-sm text-green-400 shadow-brutal">
            <div className="space-y-2">
              {terminalRows.map((row, index) => (
                <p
                  key={row}
                  className={row.includes("NO") ? "terminal-line terminal-danger" : "terminal-line"}
                  style={{ animationDelay: `${index * 180}ms` }}
                >
                  {row}
                </p>
              ))}
            </div>
            <p className="mt-4 border-t border-green-700 pt-3 text-xs text-green-200">Your file never leaves this tab.</p>
          </div>

          <DropZone
            label="Drop a PDF to try it instantly"
            onFiles={(files) => {
              void (async () => {
                const names = files.map((nextFile) => nextFile.name);
                sessionStorage.setItem("leafwork:pending-files-meta", JSON.stringify(names));
                setPendingFileNames(names);
                await addFiles(files);
                router.push("/tools/merge");
              })();
            }}
            onError={(message) => {
              console.error("hero_dropzone_error", message);
            }}
          />
        </div>
      </div>
    </section>
  );
};
