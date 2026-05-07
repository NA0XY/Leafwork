import type { ReactNode } from "react";

import { ToolSidebar } from "@/components/layout/ToolSidebar";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <ToolSidebar />
      <section>{children}</section>
    </div>
  );
}
