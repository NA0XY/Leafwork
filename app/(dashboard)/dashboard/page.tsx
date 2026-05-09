"use client";

import Link from "next/link";
import { Activity, FileStack, HardDriveDownload, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { activityUpdatedEvent, readUsageStats, usageStatsStorageKey, type LocalUsageStats } from "@/lib/utils/activity";
import { formatBytes } from "@/lib/utils/format";

type WorkflowStep = {
  tool?: string;
};

type WorkflowItem = {
  id: string;
  name: string;
  updated_at: string;
  steps: WorkflowStep[];
};

export default function DashboardPage() {
  const { loading, isAuthenticated } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [usageStats, setUsageStats] = useState<LocalUsageStats>(readUsageStats());

  useEffect(() => {
    const refreshUsage = () => setUsageStats(readUsageStats());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === usageStatsStorageKey) {
        refreshUsage();
      }
    };

    refreshUsage();
    window.addEventListener(activityUpdatedEvent, refreshUsage);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshUsage);

    return () => {
      window.removeEventListener(activityUpdatedEvent, refreshUsage);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshUsage);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setBusy(false);
      return;
    }

    const load = async () => {
      setBusy(true);
      const response = await fetch("/api/user/workflows?limit=12");
      const payload = (await response.json().catch(() => null)) as { data?: WorkflowItem[] } | null;
      setWorkflows(payload?.data ?? []);
      setBusy(false);
    };

    void load();
  }, [isAuthenticated]);

  const stats = useMemo(
    () => [
      {
        label: "Tools Used Today",
        value: usageStats.toolsUsedToday.toString(),
        icon: Activity
      },
      {
        label: "Saved Workflows",
        value: workflows.length.toString(),
        icon: Workflow
      },
      {
        label: "Files Processed",
        value: usageStats.filesProcessed.toString(),
        icon: FileStack
      },
      {
        label: "Bytes Saved",
        value: formatBytes(usageStats.bytesSaved),
        icon: HardDriveDownload
      }
    ],
    [usageStats, workflows.length]
  );

  if (loading || busy) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <SkeletonGroup lines={4} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-surface">
        <h2 className="text-xl font-bold">Login required</h2>
        <p className="mt-2 text-sm text-muted">Please login to access dashboard features.</p>
        <Button href="/login" className="mt-3">
          Go to Login
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="relative bg-surface">
              <Icon className="absolute right-3 top-3 h-5 w-5 text-primary" />
              <p className="font-mono text-4xl font-bold text-primary">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold text-muted">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-surface">
          <h2 className="mb-3 text-xl font-bold">Recent Activity</h2>
          <RecentActivity />
        </Card>

        <Card className="bg-surface">
          <h2 className="mb-3 text-xl font-bold">Saved Workflows</h2>
          {!workflows.length ? (
            <div className="rounded-brutal border-2 border-dashed border-ink bg-paper p-6 text-center">
              <p className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-green-100 text-xl font-bold">
                +
              </p>
              <p className="text-sm font-semibold">Create your first workflow</p>
              <Button href="/dashboard/workflows" className="mt-3">
                Create workflow
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {workflows.map((workflow) => {
                const firstTool = workflow.steps[0]?.tool?.replace(/_/g, "-") ?? "merge";

                return (
                  <article key={workflow.id} className="rounded-brutal border-2 border-ink bg-paper p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge>{workflow.steps.length} steps</Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {workflow.steps.map((step, index) => (
                        <span key={`${workflow.id}-step-${index}`} className="rounded-full border border-ink bg-green-100 px-2 py-0.5 text-[11px] font-semibold">
                          {(step.tool ?? "tool").replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted">Updated {new Date(workflow.updated_at).toLocaleDateString()}</p>
                      <div className="flex gap-1">
                        <Button href={`/tools/${firstTool}`} size="sm">
                          Run
                        </Button>
                        <Button href="/dashboard/workflows" size="sm" variant="secondary">
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="danger">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-surface">
        <h2 className="mb-3 text-xl font-bold">Quick Access</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            ["Merge", "/tools/merge"],
            ["Split", "/tools/split"],
            ["Compress", "/tools/compress"],
            ["PDF to Word", "/tools/pdf-to-word"],
            ["Summarize", "/tools/summarize"]
          ].map(([label, href]) => (
            <Link key={href} href={href} className="rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold">
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
