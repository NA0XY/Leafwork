"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("app_error_boundary", { error, errorInfo });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-10 max-w-xl rounded-brutal border-2 border-ink bg-red-100 p-6 text-center shadow-brutal">
          <h2 className="text-2xl font-bold text-red-900">Something broke</h2>
          <p className="mt-2 text-sm text-red-900">Reload and try again. Your files remain local in your browser.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reload App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
