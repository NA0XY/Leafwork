import type { ReactNode } from "react";

import { ToolSidebar } from "@/components/layout/ToolSidebar";
import { SandboxRail } from "@/components/sandbox/SandboxRail";
import { getToolFeatureStates } from "@/lib/config/features";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const featureStates = getToolFeatureStates();

  return (
    <div className="grid grid-cols-1 gap-4 pb-24 lg:grid-cols-[210px_minmax(0,1fr)] xl:relative xl:left-1/2 xl:w-[calc(100vw-2rem)] xl:max-w-[1680px] xl:-translate-x-1/2 xl:grid-cols-[200px_minmax(0,1fr)_280px] xl:pb-0 2xl:max-w-[1800px] 2xl:grid-cols-[210px_minmax(0,1fr)_300px]">
      <ToolSidebar featureStates={featureStates} />
      <section className="min-w-0">{children}</section>
      {featureStates.sandbox.enabled ? <SandboxRail /> : null}
    </div>
  );
}
