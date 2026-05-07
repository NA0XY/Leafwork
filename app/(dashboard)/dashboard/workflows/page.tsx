"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type WorkflowStep = {
  tool: string;
  options: Record<string, string>;
};

type Workflow = {
  id: string;
  name: string;
  steps: WorkflowStep[];
  updated_at: string;
};

const toolOptions = [
  "merge",
  "split",
  "compress",
  "pdf_to_word",
  "pdf_to_images",
  "watermark",
  "sign",
  "redact",
  "rotate",
  "metadata_strip"
] as const;

export default function WorkflowDashboardPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("My Workflow");
  const [steps, setSteps] = useState<WorkflowStep[]>([{ tool: "merge", options: {} }]);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/workflows?limit=20");
      const payload = (await response.json()) as { data?: Workflow[]; error?: { message: string } };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to load workflows");
      }
      setWorkflows(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWorkflows();
  }, []);

  const createWorkflow = async () => {
    if (steps.length > 10) {
      setError("Maximum 10 steps per workflow.");
      return;
    }

    const response = await fetch("/api/user/workflows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, steps })
    });

    const payload = (await response.json()) as { data?: Workflow; error?: { message: string } };
    const createdWorkflow = payload.data;
    if (!response.ok || !createdWorkflow) {
      setError(payload.error?.message ?? "Failed to create workflow");
      return;
    }

    setWorkflows((current) => [createdWorkflow, ...current]);
    setModalOpen(false);
    setName("My Workflow");
    setSteps([{ tool: "merge", options: {} }]);
  };

  const deleteWorkflow = async (workflowId: string) => {
    const snapshot = workflows;
    setWorkflows((current) => current.filter((workflow) => workflow.id !== workflowId));

    const response = await fetch("/api/user/workflows", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: workflowId })
    });

    if (!response.ok) {
      setWorkflows(snapshot);
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(payload?.error?.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Saved Workflows</h1>
        <Button onClick={() => setModalOpen(true)}>Create Workflow</Button>
      </div>

      {loading ? <p className="text-sm text-muted">Loading workflows...</p> : null}
      {error ? <p className="text-sm text-red-900">{error}</p> : null}

      <div className="grid gap-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{workflow.name}</h2>
                <p className="text-xs text-muted">{workflow.steps.length} steps • Updated {new Date(workflow.updated_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    sessionStorage.setItem("leafwork:run-workflow", JSON.stringify(workflow));
                    window.location.href = "/tools/merge";
                  }}
                >
                  Run
                </Button>
                <Button variant="danger" onClick={() => void deleteWorkflow(workflow.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} title="Create Workflow" onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          <label className="space-y-1 text-sm font-medium">
            Workflow name
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={`step-${index}`} className="rounded-brutal border-2 border-ink bg-paper p-2">
                <label className="text-sm font-medium">
                  Step {index + 1}
                  <select
                    className="mt-1 w-full rounded-brutal border-2 border-ink bg-surface px-2 py-1"
                    value={step.tool}
                    onChange={(event) => {
                      const tool = event.target.value;
                      setSteps((current) => current.map((item, idx) => (idx === index ? { ...item, tool } : item)));
                    }}
                  >
                    {toolOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={steps.length >= 10}
              onClick={() => setSteps((current) => [...current, { tool: "merge", options: {} }])}
            >
              Add Step
            </Button>
            <Button
              variant="secondary"
              disabled={steps.length <= 1}
              onClick={() => setSteps((current) => current.slice(0, -1))}
            >
              Remove Step
            </Button>
            <Button onClick={() => void createWorkflow()}>Save Workflow</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

